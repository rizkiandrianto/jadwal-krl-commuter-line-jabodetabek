/**
 * Balas ke Telegram
 */
function tgReplyMessage(chatId, text, extra = {}) {
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
  const payload = Object.assign({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  }, extra);

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

function telegramBOTMainFunction(params) {
    const update = params;
    const msg = update.message || update.edited_message || (update.callback_query && update.callback_query.message);
    const chatId = msg?.chat?.id;
    
    if (!chatId) return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
    const isDebugger = DEBUG_CHATIDS.includes(chatId);

    const text = (update.message && update.message.text) ? update.message.text.trim() : '';

    addDataIfNotDuplicated([
      new Date(),
      chatId,
      true,
      msg?.chat?.username || 'No Username'
    ])

    let reply = "";

    // ===== Routing berdasarkan pola =====
    if (text.startsWith('/next')) {
      reply = nextTrainHandler(text);
    } else if (text.startsWith('/stasiun')) {
      reply = handleStationsCommand(text);
    } else if (text === '/start' || text === '/help') {
      reply = helperHandler();
    }

    tgReplyMessage(chatId, reply);
}

function testMessage() {
  Logger.log(handleStationsCommand('/stations'))
}