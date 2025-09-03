/** Baca STATIONS → [{code, name, aliases:[]}, ...] */
function getStations() {
  const stations = getStationMap();

  return Object.keys(stations).map((key) => {
    const code = key.trim().toUpperCase();
    return {
      code,
      name: stations[code]?.name,
      aliases: stations[code]?.alias.split(', ')
    }
  });
}

/** Resolve input bebas → kode stasiun (cari di code & alias) */
function resolveStation(input) {
  if (!input) return "";
  const s = String(input).trim().toLowerCase();
  const stations = getStations();

  // Cocok ke code langsung
  const hitCode = stations.find(x => x.code.toLowerCase() === s);
  if (hitCode) return hitCode.code;

  // Cocok ke alias
  for (const st of stations) {
    if (st.aliases.some(a => a.toLowerCase() === s)) return st.code;
  }

  // Cocok “long alias”: hapus spasi/tanda
  const norm = s.replace(/[^\p{L}\p{N}]/gu, "");
  for (const st of stations) {
    if (st.aliases.some(a => a.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === norm)) {
      return st.code;
    }
  }
  return ""; // tidak ketemu
}

/**
 * Buat pesan HTML daftar stasiun.
 * @param {string} query  (opsional) filter berisi substring code/nama/alias
 * @param {number} page   (opsional) halaman, default 1
 * @param {number} pageSize (opsional) default 30
 */
function formatStationsHTML(query, page, pageSize) {
  const qs = String(query || "").trim().toLowerCase();
  page = Math.max(1, Number(page || 1));
  pageSize = Math.max(1, Number(pageSize || 30));

  let list = getStations();
  if (qs) {
    list = list.filter(s =>
      s.code.toLowerCase().includes(qs) ||
      s.name.toLowerCase().includes(qs) ||
      s.aliases.some(a => a.toLowerCase().includes(qs))
    );
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) page = totalPages;

  const start = (page - 1) * pageSize;
  const paged = list.slice(start, start + pageSize);

  let header = `📍 <b>Daftar Stasiun</b>${qs ? ` — filter: <i>${esc(query)}</i>` : ""}\n` +
               `Halaman ${page}/${totalPages} • ${total} data\n\n`;

  if (paged.length === 0) return header + "Tidak ada data.";

  let body = "";
  paged.forEach((s, i) => {
    const idx = start + i + 1;
    console.log(s.aliases);
    const alias = s.aliases.join(", ");
    body += `${idx}. <strong>${esc(s.code)}</strong> — ${esc(s.name || "-")}\n`;
    if (alias) {
      body += `<i>Alias:</i> <code>${esc(alias)}</code>\n`;
    }
    body += "\n";
  });

  // Footer hint
  body += qs
    ? `Gunakan: <code>/stasiun ${esc(query)} ${page+1}</code> untuk halaman berikutnya`
    : `Filter: <code>/stasiun bekasi</code>`;

  if (page !== totalPages) {
    body += `, atau \npaginasi: <code>/stasiun 2</code>`;
  }

  return header + body;
}

function handleStationsCommand(text) {
  // Contoh input:
  // /stasiun                 → semua, page 1
  // /stasiun 2               → semua, page 2
  // /stasiun bekasi          → filter "bekasi", page 1
  // /stasiun bekasi 2        → filter "bekasi", page 2
  const parts = text.trim().split(/\s+/);
  let query = "";
  let page = 1;

  if (parts.length >= 2) {
    if (/^\d+$/.test(parts[1])) {
      page = parseInt(parts[1], 10);
    } else {
      query = parts[1];
    }
  }
  if (parts.length >= 3 && /^\d+$/.test(parts[2])) {
    page = parseInt(parts[2], 10);
  }

  return formatStationsHTML(query, page, 30);
}

function testMessage() {
  Logger.log(handleStationsCommand('/stations'))
}