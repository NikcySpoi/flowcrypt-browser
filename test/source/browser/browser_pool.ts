
import { launch } from "puppeteer";
import { BrowserHandle } from './browser_handle';
import { Util } from "../util";
import * as ava from 'ava';
import { GlobalBrowser } from "../test";

class TimeoutError extends Error { }

export class BrowserPool {

  private height: number;
  private width: number;
  private semaphore: Semaphore;

  constructor(poolSize: number, width = 1280, height = 900) {
    this.height = height;
    this.width = width;
    this.semaphore = new Semaphore(poolSize, 'BrowserPool');
  }

  public newBrowserHandle = async (closeInitialPage = true) => {
    await this.semaphore.acquire();
    // ext frames in gmail: https://github.com/GoogleChrome/puppeteer/issues/2506 https://github.com/GoogleChrome/puppeteer/issues/2548
    const args = [
      '--no-sandbox', // make it work in travis-ci
      '--disable-setuid-sandbox',
      '--disable-features=site-per-process',
      '--disable-extensions-except=build/chrome',
      '--load-extension=build/chrome',
      `--window-size=${this.width + 10},${this.height + 132}`,
    ];
    // to run headless-like: "xvfb-run node test.js"
    const browser = await launch({ args, headless: false, slowMo: 50, devtools: false });
    const handle = new BrowserHandle(browser, this.semaphore, this.height, this.width);
    if (closeInitialPage) {
      await this.closeInitialExtensionPage(handle);
    }
    return handle;
  }

  public getExtensionId = async (): Promise<string> => {
    const browser = await this.newBrowserHandle(false);
    const initialPage = await browser.newPageTriggeredBy(() => null); // the page triggered on its own
    const url = initialPage.page.url();
    const match = url.match(/[a-z]{32}/);
    if (match !== null) {
      await browser.close();
      return match[0];
    }
    throw new Error(`Cannot determine extension id from url: ${url}`);
  }

  public withNewBrowser = async (cb: (browser: BrowserHandle, t: ava.ExecutionContext<{}>) => void, t: ava.ExecutionContext<{}>) => {
    const browser = await this.newBrowserHandle();
    try {
      await cb(browser, t);
    } finally {
      await Util.sleep(1);
      await browser.close();
    }
  }

  public cbWithTimeout = (cb: () => Promise<void>, timeout: number): Promise<void> => new Promise((resolve, reject) => {
    setTimeout(() => reject(new TimeoutError(`Test timed out after ${timeout}ms`)), timeout); // reject in
    cb().then(resolve, reject);
  })

  public withNewBrowserTimeoutAndRetry = async (cb: (browser: BrowserHandle, t: ava.ExecutionContext<{}>) => void, t: ava.ExecutionContext<{}>, timeout: number) => {
    for (const i of [1, 2, 3]) {
      try {
        const browser = await this.newBrowserHandle();
        try {
          return await this.cbWithTimeout(async () => await cb(browser, t), timeout);
        } finally {
          await Util.sleep(1);
          await browser.close();
        }
      } catch (e) {
        if (i < 3) {
          console.log(`Retrying: ${t.title} (${String(e)})\n${e.stack}`);
        } else {
          throw e;
        }
      }
    }
  }

  // tslint:disable-next-line:max-line-length
  public withGlobalBrowserTimeoutAndRetry = async (globalBrowser: GlobalBrowser, cb: (browser: BrowserHandle, t: ava.ExecutionContext<{}>) => void, t: ava.ExecutionContext<{}>, timeout: number) => {
    for (const i of [1, 2, 3]) {
      try {
        await globalBrowser.beforeEachTest();
        await globalBrowser.browser!.closeAllPages();
        try {
          return await this.cbWithTimeout(async () => await cb(globalBrowser.browser!, t), timeout);
        } finally {
          await Util.sleep(1);
          await globalBrowser.browser!.closeAllPages();
        }
      } catch (e) {
        if (i < 3) {
          console.log(`Retrying: ${t.title} (${String(e)})\n${e.stack}`);
        } else {
          throw e;
        }
      }
    }
  }

  private closeInitialExtensionPage = async (browser: BrowserHandle) => {
    const initialPage = await browser.newPageTriggeredBy(() => null); // the page triggered on its own
    await initialPage.waitAll('@initial-page'); // first page opened by flowcrypt
    await initialPage.close();
  }

}

export class Semaphore {

  private availableLocks: number;
  private name: string;
  private debug = false;

  constructor(poolSize: number, name = 'semaphore') {
    this.availableLocks = poolSize;
    this.name = name;
  }

  private wait = () => new Promise(resolve => setTimeout(resolve, 50 + Math.round(Math.random() * 1000))); // wait 500-1500 ms

  acquire = async () => {
    let i = 0;
    while (this.availableLocks < 1) {
      if (this.debug) {
        console.log(`[${this.name}] waiting for semaphore attempt ${i++}, now available: ${this.availableLocks}`);
      }
      await this.wait();
    }
    if (this.debug) {
      console.log(`[${this.name}] acquiring, semaphors available: ${this.availableLocks}`);
    }
    this.availableLocks--;
    if (this.debug) {
      console.log(`[${this.name}] acquired, now avaialbe: ${this.availableLocks}`);
    }
  }

  release = () => {
    if (this.debug) {
      console.log(`[${this.name}] releasing semaphore, previously available: ${this.availableLocks}`);
    }
    this.availableLocks++;
    if (this.debug) {
      console.log(`[${this.name}] released semaphore, now available: ${this.availableLocks}`);
    }
  }

}
