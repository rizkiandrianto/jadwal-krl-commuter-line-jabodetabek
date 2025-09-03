function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('Update Data')
      .addItem('Update Station', 'buildStationsMaster')
      .addItem('Normalize All Raw Data', 'normalizeAllTable')
      .addItem('Reload Master Normalized Sheet', 'combineAllNormalized')
      .addToUi();
}

function doPost(e) {
  let params = JSON.parse(e?.postData?.contents || "{}") || {}
  
  /* For Telegram BOT */
  const isFromTelegramBOT = params.update_id;

  /* For Telegram BOT */
  if (isFromTelegramBOT) {
    telegramBOTMainFunction(params);
  } else {
    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
  }
}