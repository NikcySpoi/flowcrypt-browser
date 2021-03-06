/* © 2016-2018 FlowCrypt Limited. Limitations apply. Contact human@flowcrypt.com */

'use strict';

import { Store } from '../../../js/common/platform/store.js';
import { Ui, Env } from '../../../js/common/browser.js';
import { Settings } from '../../../js/common/settings.js';
import { Pgp } from '../../../js/common/core/pgp.js';
import { Catch } from '../../../js/common/platform/catch.js';

declare const openpgp: typeof OpenPGP;

Catch.try(async () => {

  const uncheckedUrlParams = Env.urlParams(['acctEmail', 'parentTabId']);
  const acctEmail = Env.urlParamRequire.string(uncheckedUrlParams, 'acctEmail');
  const parentTabId = Env.urlParamRequire.string(uncheckedUrlParams, 'parentTabId');

  await Ui.passphraseToggle(['original_password', 'password', 'password2']);

  const privateKeys = await Store.keysGet(acctEmail);
  if (privateKeys.length > 1) {
    $('#step_0_enter .sentence').text('Enter the current passphrase for your primary key');
    $('#step_0_enter #original_password').attr('placeholder', 'Current primary key pass phrase');
    $('#step_1_password #password').attr('placeholder', 'Enter a new primary key pass phrase');
  }

  const [primaryKi] = await Store.keysGet(acctEmail, ['primary']);
  Settings.abortAndRenderErrorIfKeyinfoEmpty(primaryKi);

  let origPassphrase = await Store.passphraseGet(acctEmail, primaryKi.longid);

  const displayBlock = (name: string) => {
    const blocks = ['step_0_enter', 'step_1_password', 'step_2_confirm', 'step_3_done'];
    for (const block of blocks) {
      $('#' + block).css('display', 'none');
    }
    $('#' + name).css('display', 'block');
  };

  if (origPassphrase) {
    displayBlock('step_0_enter');
  } else {
    if (origPassphrase === '') {
      $('h1').text('Set a pass phrase');
    } else {
      $('h1').text('Change your pass phrase');
    }
    displayBlock('step_1_password');
  }

  $('.action_enter').click(Ui.event.handle(async () => {
    const { keys: [prv] } = await openpgp.key.readArmored(primaryKi.private);
    if (await Pgp.key.decrypt(prv, [String($('#original_password').val())]) === true) {
      origPassphrase = String($('#original_password').val());
      displayBlock('step_1_password');
    } else {
      alert('Pass phrase did not match, please try again.');
      $('#original_password').val('').focus();
    }
  }));

  $('#password').on('keyup', Ui.event.prevent('spree', () => Settings.renderPasswordStrength('#step_1_password', '#password', '.action_password')));

  $('.action_password').click(Ui.event.handle(target => {
    if ($(target).hasClass('green')) {
      displayBlock('step_2_confirm');
    } else {
      alert('Please select a stronger pass phrase. Combinations of 4 to 5 uncommon words are the best.');
    }
  }));

  $('.action_reset_password').click(Ui.event.handle(() => {
    $('#password').val('');
    $('#password2').val('');
    displayBlock('step_1_password');
    Settings.renderPasswordStrength('#step_1_password', '#password', '.action_password');
    $('#password').focus();
  }));

  $('.action_change').click(Ui.event.prevent('double', async self => {
    const newPassphrase = String($('#password').val());
    if (newPassphrase !== $('#password2').val()) {
      alert('The two pass phrases do not match, please try again.');
      $('#password2').val('');
      $('#password2').focus();
    } else {
      const { keys: [prv] } = await openpgp.key.readArmored(primaryKi.private);
      if (!prv.isDecrypted()) {
        await Pgp.key.decrypt(prv, [origPassphrase!]); // !null because we checked for this above, and user entry cannot be null
      }
      await Settings.openpgpKeyEncrypt(prv, newPassphrase);
      const storedPassphrase = await Store.passphraseGet(acctEmail, primaryKi.longid, true);
      await Store.keysAdd(acctEmail, prv.armor());
      await Store.passphraseSave('local', acctEmail, primaryKi.longid, typeof storedPassphrase !== 'undefined' ? newPassphrase : undefined);
      await Store.passphraseSave('session', acctEmail, primaryKi.longid, typeof storedPassphrase !== 'undefined' ? undefined : newPassphrase);
      const { setup_simple } = await Store.getAcct(acctEmail, ['setup_simple']);
      if (setup_simple) {
        Settings.redirectSubPage(acctEmail, parentTabId, '/chrome/settings/modules/backup.htm', '&action=passphrase_change_gmail_backup');
      } else {
        alert('Now that you changed your pass phrase, you should back up your key. New backup will be protected with new passphrase.');
        Settings.redirectSubPage(acctEmail, parentTabId, '/chrome/settings/modules/backup.htm', '&action=options');
      }
    }
  }));

})();
