import { Url, BrowserHandle } from '../browser';
import { OauthPageRecipe, SettingsPageRecipe, SetupPageRecipe } from './page_recipe';
import { Util } from '../util';

export class BrowserRecipe {

  public static openSettingsLoginButCloseOauthWindowBeforeGrantingPermission = async (browser: BrowserHandle, acctEmail: string) => {
    const settingsPage = await browser.newPage(Url.extensionSettings());
    const oauthPopup0 = await browser.newPageTriggeredBy(() => settingsPage.waitAndClick('@action-connect-to-gmail'));
    await OauthPageRecipe.google(oauthPopup0, acctEmail, 'close');
    // dialog shows up with permission explanation
    await SettingsPageRecipe.closeDialog(settingsPage);
    return settingsPage;
  }

  public static openSettingsLoginApprove = async (browser: BrowserHandle, acctEmail: string) => {
    const settingsPage = await browser.newPage(Url.extensionSettings());
    const oauthPopup = await browser.newPageTriggeredBy(() => settingsPage.waitAndClick('@action-connect-to-gmail'));
    await OauthPageRecipe.google(oauthPopup, acctEmail, 'approve');
    return settingsPage;
  }

  public static openGmailPage = async (browser: BrowserHandle, googleLoginIndex = 0) => {
    const gmailPage = await browser.newPage(Url.gmail(googleLoginIndex));
    await gmailPage.waitAll('div.z0'); // compose button container visible
    await Util.sleep(3); // give it extra time to make sure FlowCrypt is initialized if it was supposed to
    return gmailPage;
  }

  public static openGmailPageAndVerifyComposeBtnPresent = async (browser: BrowserHandle, googleLoginIndex = 0) => {
    const gmailPage = await BrowserRecipe.openGmailPage(browser, googleLoginIndex);
    await gmailPage.waitAll('@action-secure-compose');
    return gmailPage;
  }

  public static openGmailPageAndVerifyComposeBtnNotPresent = async (browser: BrowserHandle, googleLoginIndex = 0) => {
    const gmailPage = await BrowserRecipe.openGmailPage(browser, googleLoginIndex);
    await Util.sleep(3);
    await gmailPage.notPresent('@action-secure-compose');
    return gmailPage;
  }

  public static setUpFcCompatAcct = async (browser: BrowserHandle) => {
    const settingsPage = await BrowserRecipe.openSettingsLoginApprove(browser, 'flowcrypt.compatibility@gmail.com');
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: true });
    await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1');
    await settingsPage.close();
  }

  public static pgpBlockVerifyDecryptedContent = async (browser: BrowserHandle, url: string, expectedContents: string[], password?: string) => {
    const pgpBlockPage = await browser.newPage(url);
    await pgpBlockPage.waitAll('@pgp-block-content');
    await pgpBlockPage.waitForSelTestState('ready', 100);
    await Util.sleep(1);
    if (password) {
      await pgpBlockPage.waitAndType('@input-message-password', password);
      await pgpBlockPage.waitAndClick('@action-decrypt-with-password');
      await Util.sleep(1);
      await pgpBlockPage.waitForSelTestState('ready', 10);
    }
    const content = await pgpBlockPage.read('@pgp-block-content');
    for (const expectedContent of expectedContents) {
      if (content.indexOf(expectedContent) === -1) {
        await pgpBlockPage.close();
        throw new Error(`pgp_block_verify_decrypted_content:missing expected content:${expectedContent}`);
      }
    }
    await pgpBlockPage.close();
  }

}
