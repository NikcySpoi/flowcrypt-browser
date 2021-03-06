
/* © 2016-2018 FlowCrypt Limited. Limitations apply. Contact human@flowcrypt.com */

'use strict';

import { Ui, Env } from '../../../js/common/browser.js';
import { Store } from '../../../js/common/platform/store.js';
import { BrowserMsg } from '../../../js/common/extension.js';
import { Catch } from '../../../js/common/platform/catch.js';

Catch.try(async () => {

  Ui.event.protect();

  const uncheckedUrlParams = Env.urlParams(['acctEmail', 'parentTabId']); // placement: compose||settings
  const acctEmail = Env.urlParamRequire.string(uncheckedUrlParams, 'acctEmail');
  const parentTabId = Env.urlParamRequire.string(uncheckedUrlParams, 'parentTabId');

  const saveFooterIfHasSubscriptionAndRequested = async (requested: boolean, footer: string) => {
    const subscription = await Store.subscription();
    if (requested && subscription.active) {
      await Store.setAcct(acctEmail, { email_footer: footer });
    }
  };

  const subscription = await Store.subscription();
  if (subscription.active) {
    const storage = await Store.getAcct(acctEmail, ['email_footer']);
    $('.input_email_footer').val(storage.email_footer || '');
    $('.user_subscribed').css('display', 'block');
  } else {
    $('.user_free').css('display', 'block');
    $('.action_upgrade').click(Ui.event.prevent('double', async target => {
      const subscribeResult = await BrowserMsg.send.await.showSubscribeDialog(parentTabId);
      if (subscribeResult && subscribeResult.active) {
        $('.user_subscribed').css('display', 'block');
        $('.user_free').css('display', 'none');
      }
    }));
  }

  $('.action_add_footer').click(Ui.event.prevent('double', async self => {
    await saveFooterIfHasSubscriptionAndRequested(Boolean($('.input_remember').prop('checked')), String($('.input_email_footer').val()));
    BrowserMsg.send.setFooter(parentTabId, { footer: String($('.input_email_footer').val()) });
  }));

  $('.action_cancel').click(Ui.event.handle(() => BrowserMsg.send.closeDialog(parentTabId)));

})();
