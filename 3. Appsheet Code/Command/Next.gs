function parseRelationToStationName(stations, relation) {
  const arrayRelation = (esc(relation).toUpperCase()).replace(' ', '').trim().split('-');
  let message = '';

  arrayRelation.forEach((rel, relId) => {
    message += stations[rel]?.name || rel;
    if (relId !== arrayRelation.length - 1) {
      message += ' - ';
    }
  })

  return message;
}

function parseNextArgs(text) {
  // buang "/next" & optional @botname → ambil sisa args
  const args = text.replace(/^\/next(@\w+)?/i, "").trim().split(/\s+/).filter(Boolean);

  // default
  let stn = args[0] ? args[0].toUpperCase() : "BKS";
  let tujuan = "";
  let after = 0;
  let baseTime = ""; // "HH:MM" jika ada
  let limit = 5;

  // arg[1] bisa: tujuan | menit | HH:MM
  if (args.length >= 2) {
    if (/^\d{1,2}:\d{2}$/.test(args[1])) {
      baseTime = args[1]; // /next STN HH:MM [limit]
      if (args.length >= 3 && /^\d+$/.test(args[2])) limit = parseInt(args[2],10);
    } else if (/^\d+$/.test(args[1])) {
      after = parseInt(args[1],10); // /next STN MIN [limit]
      if (args.length >= 3 && /^\d+$/.test(args[2])) limit = parseInt(args[2],10);
    } else {
      tujuan = args[1].toUpperCase(); // /next STN TUJUAN ...
    }
  }

  // jika ada tujuan, arg selanjutnya bisa HH:MM atau menit lalu limit
  if (tujuan && args.length >= 3) {
    if (/^\d{1,2}:\d{2}$/.test(args[2])) {
      baseTime = args[2];                       // /next STN TUJUAN HH:MM [limit]
      if (args.length >= 4 && /^\d+$/.test(args[3])) limit = parseInt(args[3],10);
    } else if (/^\d+$/.test(args[2])) {
      after = parseInt(args[2],10);             // /next STN TUJUAN MIN [limit]
      if (args.length >= 4 && /^\d+$/.test(args[3])) limit = parseInt(args[3],10);
    }
  }

  return { stn, tujuan, after, baseTime, limit };
}

function nextTrains(stasiun, tujuan, afterMinutes, limit, baseTime) {
  stasiun = String(stasiun || "").toUpperCase().trim();
  tujuan  = tujuan ? String(tujuan).toUpperCase().trim() : "";
  afterMinutes = Number(afterMinutes || 0);
  limit = Number(limit || 5);

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(MASTER_NORMALIZED_SHEET);
  if (!sh) throw new Error("MASTER_NORMALIZED tidak ditemukan");

  const rng = sh.getDataRange().getValues();
  const header = rng[0];
  const idx = (name) => header.indexOf(name);
  const iNo = idx("No"), iKA = idx("Nomor KA"), iRel = idx("Relasi"), iStn = idx("Stasiun"), iWkt = idx("Waktu");
  if ([iNo,iKA,iRel,iStn,iWkt].some(i => i < 0)) throw new Error("Header MASTER_NORMALIZED invalid");

  const now = new Date();
  let base;
  if (baseTime && /^\d{1,2}:\d{2}$/.test(baseTime)) {
    const [H,M] = baseTime.split(":").map(Number);
    base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), H, M, 0);
  } else {
    base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()+afterMinutes, 0);
  }

  const candidates = [];
  for (let r = 1; r < rng.length; r++) {
    const row = rng[r];
    if (row[iStn] !== stasiun) continue;
    const t = row[iWkt];
    if (!(t instanceof Date)) continue;
    const tt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t.getHours(), t.getMinutes(), 0);
    if (tt < base) continue;
    candidates.push({ no: row[iNo], ka: row[iKA], rel: row[iRel], st: row[iStn], t: tt });
  }

  let results = candidates;
  if (tujuan) {
    const perKa = new Map();
    for (let r = 1; r < rng.length; r++) {
      const row = rng[r];
      if (row[iStn] !== tujuan) continue;
      const t = row[iWkt];
      if (t instanceof Date) {
        const tt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t.getHours(), t.getMinutes(), 0);
        const prev = perKa.get(row[iKA]);
        if (!prev || tt < prev) perKa.set(row[iKA], tt);
      }
    }
    results = candidates.filter(c => {
      const tdst = perKa.get(c.ka);
      return tdst && tdst > c.t;
    });
  }

  results.sort((a,b) => a.t - b.t);
  results = results.slice(0, limit);

  const out = [["Nomor KA","Relasi","Stasiun","Waktu"]];
  for (const r of results) {
    out.push([r.ka, r.rel, r.st, Utilities.formatDate(r.t, "Asia/Jakarta", "HH:mm")]);
  }
  return out;
}

function formatNextTrainsMessageHTML(stasiun, tujuan, afterMinutes, limit, baseTime) {
  const rows = nextTrains(stasiun, tujuan, afterMinutes, limit, baseTime);
  if (!rows || rows.length <= 1) return "❌ Tidak ada kereta ditemukan";

  const stationsMap = getStationMap();
  const nameOf = (code) => (stationsMap[code]?.name || code);

  const now = new Date();
  let base;
  if (baseTime && /^\d{1,2}:\d{2}$/.test(baseTime)) {
    const [H,M] = baseTime.split(":").map(Number);
    base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), H, M, 0);
  } else {
    base = new Date(now.getTime() + (afterMinutes||0)*60000);
  }
  const baseStr = Utilities.formatDate(base, "Asia/Jakarta", "HH:mm");

  let header =
    `🚆 <b>Next Trains — ${nameOf(stasiun)}${tujuan?(" → "+nameOf(tujuan)):""}</b>\n` +
    `<i>Waktu acuan: ${baseStr}</i>\n\n`;

  // untuk ETA tujuan
  const sh = SpreadsheetApp.getActive().getSheetByName(MASTER_NORMALIZED_SHEET);
  const data = sh.getDataRange().getValues();
  const head = data[0] || [];
  const idxKA  = head.indexOf("Nomor KA");
  const idxStn = head.indexOf("Stasiun");
  const idxWkt = head.indexOf("Waktu");

  const fmtTime = (v)=> v instanceof Date ? Utilities.formatDate(v,"Asia/Jakarta","HH:mm") : String(v||"");

  let body = "";
  for (let i = 1; i < rows.length; i++) {
    const [ka, relasi, stn, jam] = rows[i];
    body += `${i}️⃣ <b>KA ${esc(ka)}</b> <i>(${parseRelationToStationName(stationsMap, relasi)})</i>\n`;
    body += ` • Stasiun <b>${esc(nameOf(stn))}</b> ⏰ ${esc(fmtTime(jam))}\n`;

    if (tujuan) {
      const tujuanRow = data.find(r => r[idxKA] == ka && r[idxStn] == tujuan);
      if (tujuanRow && tujuanRow[idxWkt] instanceof Date) {
        body += ` • Tiba <b>${esc(nameOf(tujuan))}</b> ⏰ ${esc(fmtTime(tujuanRow[idxWkt]))}\n`;
      }
    }
    body += `\n`;
  }
  return header + body.trim();
}

function nextTrainHandler(text) {
  const parts = text.split(/\s+/); 
  
  if (parts.length === 1) { 
    return "Halo 👋 \nKetik <code>/next CC THB 10 3</code> untuk melihat kereta berikutnya.\nFormat: <code>/next [stasiun] [tujuan] [menit ke depan / waktu] [limit]</code>"; 
  }

  const { stn, tujuan, after, baseTime, limit } = parseNextArgs(text);

  try {
    return formatNextTrainsMessageHTML(stn, tujuan, after, limit, baseTime);
  } catch (err) {
    return "⚠️ Terjadi error: " + esc(err.message);
  }
}