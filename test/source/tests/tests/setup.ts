import { TestWithBrowser, TestWithGlobalBrowser } from '..';
import { PageRecipe, SetupPageRecipe } from '../page_recipe';
import { BrowserRecipe } from '../browser_recipe';
import * as ava from 'ava';

// tslint:disable:prefer-const

export let defineSetupTests = (testWithBrowser: TestWithBrowser, testWithSemaphoredGlobalBrowser: TestWithGlobalBrowser) => {

  ava.test.todo('setup - no connection when pulling backup - retry prompt shows and works');

  ava.test.todo('setup - simple - no connection when making a backup - retry prompt shows');

  ava.test.todo('setup - advanced - no connection when making a backup - retry prompt shows');

  ava.test.todo('setup - no connection when submitting public key - retry prompt shows and works');

  ava.test('settings > login > close oauth window > close popup', testWithBrowser(async (browser, t) => {
    await BrowserRecipe.openSettingsLoginButCloseOauthWindowBeforeGrantingPermission(browser, 'flowcrypt.test.key.imported@gmail.com');
  }));

  ava.test('gmail setup prompt notification shows up + goes away when close clicked + shows up again + setup link opens settings', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginButCloseOauthWindowBeforeGrantingPermission(browser, 'flowcrypt.test.key.imported@gmail.com');
    await settingsPage.close();
    let gmailPage = await BrowserRecipe.openGmailPage(browser);
    await gmailPage.waitAll(['@webmail-notification', '@notification-setup-action-open-settings', '@notification-setup-action-dismiss', '@notification-setup-action-close']);
    await gmailPage.waitAndClick('@notification-setup-action-close', { confirmGone: true });
    await gmailPage.close();
    gmailPage = await BrowserRecipe.openGmailPage(browser);
    await gmailPage.waitAll(['@webmail-notification', '@notification-setup-action-open-settings', '@notification-setup-action-dismiss', '@notification-setup-action-close']);
    let newSettingsPage = await browser.newPageTriggeredBy(() => gmailPage.waitAndClick('@notification-setup-action-open-settings'));
    await newSettingsPage.waitAll('@action-connect-to-gmail');
  }));

  ava.test('gmail shows success notification after setup + goes away after click + does not re-appear', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.imported@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp');
    let gmailPage = await BrowserRecipe.openGmailPage(browser);
    await gmailPage.waitAll(['@webmail-notification', '@notification-successfully-setup-action-close']);
    await gmailPage.waitAndClick('@notification-successfully-setup-action-close', { confirmGone: true });
    await gmailPage.close();
    gmailPage = await BrowserRecipe.openGmailPage(browser);
    await gmailPage.notPresent(['@webmail-notification', '@notification-setup-action-close', '@notification-successfully-setup-action-close']);
  }));

  ava.test('gmail setup prompt notification shows up + dismiss hides it + does not reappear if dismissed', testWithBrowser(async (browser, t) => {
    await BrowserRecipe.openSettingsLoginButCloseOauthWindowBeforeGrantingPermission(browser, 'flowcrypt.test.key.imported@gmail.com');
    let gmailPage = await BrowserRecipe.openGmailPage(browser);
    await gmailPage.waitAll(['@webmail-notification', '@notification-setup-action-open-settings', '@notification-setup-action-dismiss', '@notification-setup-action-close']);
    await gmailPage.waitAndClick('@notification-setup-action-dismiss', { confirmGone: true });
    await gmailPage.close();
    gmailPage = await BrowserRecipe.openGmailPage(browser);
    await gmailPage.notPresent(['@webmail-notification', '@notification-setup-action-open-settings', '@notification-setup-action-dismiss', '@notification-setup-action-close']);
  }));

  ava.test('setup - import key - do not submit - did not use before', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.imported@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp', { submitPubkey: false, usedPgpBefore: false });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - import key - submit - used before', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.used.pgp@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp', { submitPubkey: true, usedPgpBefore: true });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - import key - naked - choose my own pass phrase', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.import.naked@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.naked', { submitPubkey: false, usedPgpBefore: false, naked: true });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - import key - naked - auto-generate a pass phrase', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.import.naked@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.naked', { submitPubkey: false, usedPgpBefore: false, naked: true, genPp: true });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test.todo('setup - import key - naked - do not supply pass phrase gets error');

  ava.test('setup - import key - fix key self signatures', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.imported@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'missing.self.signatures', { submitPubkey: false, fixKey: true });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - import key - fix key self signatures - skip invalid uid', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.imported@gmail.com');
    await SetupPageRecipe.manualEnter(settingsPage, 'missing.self.signatures.invalid.uid', { submitPubkey: false, fixKey: true });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test.todo('setup - create key advanced - do not remember pass phrase');

  ava.test.todo('setup - create key advanced - backup as a file');

  ava.test.todo('setup - create key simple');

  ava.test('setup - create key advanced - no backup', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.new.manual@gmail.com');
    await SetupPageRecipe.createAdvanced(settingsPage, 'flowcrypt.test.key.used.pgp', 'none', { submitPubkey: false, usedPgpBefore: false });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - recover with a pass phrase - skip remaining', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: false });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - recover with a pass phrase - 1pp1 then 2pp1', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1');
  }));

  ava.test('setup - recover with a pass phrase - 1pp2 then 2pp1', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp2', { hasRecoverMore: true, clickRecoverMore: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1');
  }));

  ava.test('setup - recover with a pass phrase - 2pp1 then 1pp1', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1', { hasRecoverMore: true, clickRecoverMore: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1');
  }));

  ava.test('setup - recover with a pass phrase - 2pp1 then 1pp2', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1', { hasRecoverMore: true, clickRecoverMore: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp2');
  }));

  ava.test('setup - recover with a pass phrase - 1pp1 then 1pp2 (shows already recovered), then 2pp1', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp2', { alreadyRecovered: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1', {});
  }));

  ava.test.todo('setup - recover with a pass phrase - 1pp1 then wrong, then skip');
  // ava.test('setup - recover with a pass phrase - 1pp1 then wrong, then skip', test_with_browser(async (browser, t) => {
  //   let settingsPage = await BrowserRecipe.open_settings_login_approve(browser, 'flowcrypt.compatibility@gmail.com');
  //   await SetupPageRecipe.setup_recover(settingsPage, 'flowcrypt.compatibility.1pp1', {has_recover_more: true, click_recover_more: true});
  //   await SetupPageRecipe.setup_recover(settingsPage, 'flowcrypt.wrong.passphrase', {wrong_passphrase: true});
  //   await Util.sleep(200);
  // }));

  ava.test('setup - recover with a pass phrase - no remaining', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.recovered@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.test.key.recovered', { hasRecoverMore: false });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

  ava.test('setup - fail to recover with a wrong pass phrase', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.recovered@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.wrong.passphrase', { hasRecoverMore: false, wrongPp: true });
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnNotPresent(browser);
  }));

  ava.test('setup - fail to recover with a wrong pass phrase at first, then recover with good pass phrase', testWithBrowser(async (browser, t) => {
    let settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.test.key.recovered@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.wrong.passphrase', { wrongPp: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.test.key.recovered');
    await BrowserRecipe.openGmailPageAndVerifyComposeBtnPresent(browser);
  }));

};
