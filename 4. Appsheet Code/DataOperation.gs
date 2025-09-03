/**
 * Normalize jadwal KRL dari format lebar (wide) ke long:
 * Output kolom: [No, Nomor KA, Relasi, Stasiun, Waktu]
 *
 * @param {string} sourceSheetName Nama sheet sumber (mis. "Rangkas - Tanah Abang")
 * @param {string} targetSheetName Nama sheet output normalize (mis. "NORMALIZED_RK_THB")
 */
function normalizeTimetable(sourceSheetName, targetSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const src = ss.getSheetByName(sourceSheetName);
  if (!src) throw new Error(`Sheet sumber tidak ditemukan: ${sourceSheetName}`);

  const lastRow = src.getLastRow();
  const lastCol = src.getLastColumn();
  if (lastRow < 2) throw new Error(`Sheet sumber "${sourceSheetName}" kosong / tidak ada data.`);

  const values = src.getRange(1, 1, lastRow, lastCol).getValues();

  // Header asumsi baris 1: ["No","Nomor KA","Relasi", ... stasiun ..., "Keterangan"]
  const header = values[0].map(v => (v || "").toString().trim());
  const colNo = header.indexOf("No");
  const colKA = header.indexOf("Nomor KA");
  const colRelasi = header.indexOf("Relasi");
  const colKet = header.indexOf("Keterangan");

  if (colNo !== 0 || colKA !== 1 || colRelasi !== 2)
    throw new Error(`Header tidak sesuai. Pastikan kolom pertama: No | Nomor KA | Relasi`);
  if (colKet === -1) throw new Error(`Kolom "Keterangan" tidak ditemukan pada baris header.`);

  // Kolom stasiun = dari kolom index 3 (D) s.d. sebelum "Keterangan"
  const stationStartIdx = 3; // kolom D = index 3 (0-based)
  const stationEndIdx = colKet - 1;
  if (stationEndIdx < stationStartIdx) throw new Error(`Rentang kolom stasiun tidak valid.`);

  const stationNames = header.slice(stationStartIdx, stationEndIdx + 1);

  const out = [];
  out.push(["No", "Nomor KA", "Relasi", "Stasiun", "Waktu"]); // header output

  const timeRegex = /^\d{2}:\d{2}$/; // contoh 04:37
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const no = row[colNo];
    const nomorKA = row[colKA];
    const relasi = row[colRelasi];

    // Baris data valid harus ada No (angka) & Nomor KA
    if (no === "" || nomorKA === "" || relasi === "") continue;

    for (let c = stationStartIdx; c <= stationEndIdx; c++) {
      const stName = stationNames[c - stationStartIdx];
      const t = (row[c] || "").toString().trim();

      // Ambil hanya yang "berhenti" (ada waktu valid)
      if (timeRegex.test(t)) {
        out.push([no, nomorKA, relasi, stName, t]);
      }
    }
  }

  // Tulis ke sheet target
  let tgt = ss.getSheetByName(targetSheetName);
  if (!tgt) tgt = ss.insertSheet(targetSheetName);
  tgt.clearContents();
  if (out.length > 1) tgt.getRange(1, 1, out.length, out[0].length).setValues(out);

  // Opsional: format kolom waktu agar terbaca sebagai hh:mm
  tgt.getRange(2, 5, Math.max(0, out.length - 1), 1).setNumberFormat("hh:mm");

  // Autosize
  tgt.autoResizeColumns(1, 5);
}

function buildStationsMaster() {
  const ss = SpreadsheetApp.getActive();
  const sourceSheets = getRawDataSheets();

  // Kamus nama stasiun (lengkapi sesuka hati)
  const NAME_MAP = STATION_NAME_MAP;

  const allCodes = new Set();

  for (const sheetName of sourceSheets) {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) continue;
    const lastCol = sh.getLastColumn();
    // Cari kolom "Keterangan" di header baris 1
    const header = sh.getRange(1,1,1,lastCol).getValues()[0].map(v => String(v||"").trim());
    const ketIdx = header.indexOf("Keterangan");
    const startCol = 3; // kolom D (1-based)
    const endCol = ketIdx > -1 ? ketIdx : lastCol;
    for (let c = startCol; c < endCol; c++) {
      const code = header[c];
      if (code && !["No","Nomor KA","Relasi"].includes(code)) {
        allCodes.add(code);
      }
    }
  }

  // Buat / bersihkan sheet STATIONS
  let tgt = ss.getSheetByName(STATIONS_SHEET);
  if (!tgt) tgt = ss.insertSheet(STATIONS_SHEET);
  tgt.clearContents();
  tgt.getRange(1,1,1,3).setValues([["KODE","Nama Stasiun","Alias"]]);

  // Susun data
  const codes = Array.from(allCodes).sort();
  const out = [];
  for (const code of codes) {
    const name = NAME_MAP[code] || ""; // kosongkan jika belum ada di kamus
    const aliasSuggestion = buildAliasSuggestion(code, name);
    out.push([code, name, aliasSuggestion]);
  }
  if (out.length) {
    tgt.getRange(2,1,out.length,3).setValues(out);
    tgt.autoResizeColumns(1,3);
  }
}

function normalizeAllTable() {
  const rawSheets = getRawDataSheets();

  rawSheets.forEach((sheetName) => {
    normalizeTimetable(sheetName, sheetName.replace(RAW_SHEET_PREFIX, NORMALIZED_SHEET_PREFIX));
  })
}

function combineAllNormalized() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(MASTER_NORMALIZED_SHEET) || ss.insertSheet(MASTER_NORMALIZED_SHEET);
  const targetCell = targetSheet.getRange("A2"); // set formula in A2

  const ranges = getRawDataSheets().map(name => `'${name.replace(RAW_SHEET_PREFIX, NORMALIZED_SHEET_PREFIX)}'!A2:E`).join(";");

  // full QUERY formula
  const formula = `=QUERY({${ranges}},"select * where Col1 is not null",0)`;
  
  // set formula into target cell
  targetCell.setFormula(formula);
}

function addDataIfNotDuplicated(newData, markerColumn = 1) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHAT_SHEET);
  const data = sheet.getDataRange().getValues(); // Mendapatkan seluruh data di sheet
  
  const column = data.map(row => row[markerColumn]); // Mendapatkan nilai dari kolom B
  
  // Cek apakah nilai di kolom A sudah ada
  if (!column.includes(newData[markerColumn])) {
    // Jika belum ada, tambahkan data di baris baru
    sheet.appendRow(newData);
    Logger.log('Data berhasil ditambahkan');
  } else {
    Logger.log('Data sudah ada di kolom A, tidak ditambahkan');
  }
}