/* © 2016-2018 FlowCrypt Limited. Limitations apply. Contact human@flowcrypt.com */

'use strict';

tool.catch.try(async () => {

  tool.ui.event.protect();

  const url_params = tool.env.url_params(['account_email', 'from', 'to', 'subject', 'frame_id', 'thread_id', 'thread_message_id', 'parent_tab_id', 'skip_click_prompt', 'ignore_draft']);

  let [primary_k] = await Store.keys_get(url_params.account_email as string, ['primary']);

  const attachment = tool.file.keyinfo_as_pubkey_attachment(primary_k);
  let additional_message_headers: FlatHeaders;

  let app_functions = Composer.default_app_functions();
  app_functions.send_message_to_main_window = (channel: string, data: Dict<Serializable>) => tool.browser.message.send(url_params.parent_tab_id as string, channel, data);
  let composer = new Composer(app_functions, {is_reply_box: true, frame_id: url_params.frame_id}, new Subscription(null));

  for(let to of (url_params.to as string).split(',')) {
    $('.recipients').append(tool.e('span', {text: to}));
  }

  // render
  $('.pubkey_file_name').text(attachment.name);
  composer.resize_reply_box(); // todo - change to class
  tool.browser.message.send(url_params.parent_tab_id as string, 'scroll', {selector: '.reply_message_iframe_container', repeat: [500]});
  $('#input_text').focus();

  // determine reply headers
  try {
    let thread = await tool.api.gmail.thread_get(url_params.account_email as string, url_params.thread_id as string, 'full');
    if (thread.messages && thread.messages.length > 0) {
      let thread_message_id_last = tool.api.gmail.find_header(thread.messages[thread.messages.length - 1], 'Message-ID') || '';
      let thread_message_referrences_last = tool.api.gmail.find_header(thread.messages[thread.messages.length - 1], 'In-Reply-To') || '';
      additional_message_headers = { 'In-Reply-To': thread_message_id_last, 'References': thread_message_referrences_last + ' ' + thread_message_id_last };
    }
  } catch(e) {
    tool.catch.handle_exception(e);
  }

  // send
  $('#send_btn').click(tool.ui.event.prevent(tool.ui.event.double(), (self) => {
    $('#send_btn').text('sending..');
    let message = tool.api.common.message(url_params.account_email as string, url_params.from as string, url_params.to as string, url_params.subject as string, {'text/plain': $('#input_text').get(0).innerText}, [attachment], url_params.thread_id as string);
    for(let k of Object.keys(additional_message_headers)) {
      message.headers[k] = additional_message_headers[k];
    }
    tool.api.gmail.message_send(url_params.account_email as string, message, (success, response) => {
      if(success) {
        tool.browser.message.send(url_params.parent_tab_id as string, 'notification_show', { notification: 'Message sent.' });
        $('#compose').replaceWith('Message sent. The other person should use this information to send a new message.');
      } else {
        $('#send_btn').text('send response');
        alert('There was an error sending message, please try again');
      }
    });
  }));
  
})();