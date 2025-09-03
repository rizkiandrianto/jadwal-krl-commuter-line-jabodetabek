function buildAliasSuggestion(code, name) {
  const parts = new Set();
  const lc = s => (s||"").toString().toLowerCase().trim();
  const strip = s => lc(s).replace(/[^\p{L}\p{N}]/gu, "");
  const novowel = s => lc(s).replace(/[aeiou]/g,"");

  parts.add(lc(code));
  if (name) {
    parts.add(lc(name));
    parts.add(strip(name));     // tanpa spasi/tanda
    parts.add(novowel(name));   // tanpa vokal
  }
  return Array.from(parts).filter(Boolean).join(", ");
}

/** Util: escape HTML biar aman dikirim ke Telegram */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeMdV2(text) {
  return String(text)
    .replace(/([\\*_`\[\]()~>|{}+\-.!])/g, '\\$1')  // Escape characters that are special in MarkdownV2
    .replace(/(\|)/g, '\\|');  // Escape pipe symbol for tables, etc.
}

function getRawDataSheets() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets() || [];
  return sheets.map(sheet => sheet.getName()).filter(sheetName => sheetName.startsWith('RAW_'));
}

/**
 * Baca sheet STATIONS lalu kembalikan object:
 * {
 *   "CC": { name: "Cicayur", alias: "cicayur, cc, ..." },
 *   "BKS": { name: "Bekasi", alias: "bks, bekasi, ..." },
 *   ...
 * }
 */
function getStationMap() {
  const sh = SpreadsheetApp.getActive().getSheetByName(STATIONS_SHEET);
  if (!sh) throw new Error('Sheet "STATIONS" tidak ditemukan');

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return {};

  // header indexes (case-insensitive)
  const head = values[0].map(h => String(h || "").trim().toLowerCase());
  const iCode = head.indexOf("kode");
  const iName = head.indexOf("nama stasiun");
  const iAlias = head.indexOf("alias");
  if (iCode < 0 || iName < 0 || iAlias < 0) {
    throw new Error('Header STATIONS harus: "KODE | Nama Stasiun | Alias" di baris 1');
  }

  const map = {};
  for (let r = 1; r < values.length; r++) {
    const code = String(values[r][iCode] || "").trim();
    if (!code) continue;
    const name  = String(values[r][iName]  || "").trim();
    const alias = String(values[r][iAlias] || "").trim(); // simpan sebagai string sesuai permintaan

    map[code.toUpperCase()] = { name, alias };
  }
  return map;
}