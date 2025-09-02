function helperHandler() {
  return `
   <b>🚆 Jabodetabek Commuter Line Bot</b>
   Selamat datang! Bot ini membantu cek jadwal KRL Jabodetabek.

   <b>Perintah Utama</b>
   • <code>/next</code> — Cek jadwal kereta berikutnya
     Format: <code>/next [kode_stasiun_asal] [kode_stasiun_tujuan] [menit_ke_depan / waktu] [limit]</code>\n
     Contoh: <code>/next CC THB 5 3</code>\n
     <i>Keterangan:</i>
       <code>[menit_ke_depan]</code> adalah offset waktu dari sekarang, bisa juga diisi dengan <code>[waktu]</code>, cth: <code>10:00</code>;
       <code>[limit]</code> jumlah hasil yang ditampilkan.

    • <code>/stasiun</code> — Tampilkan daftar kode, nama &amp; alias stasiun

   <b>Tips</b>
   • Dapatkan filter keyword untuk menampilkan stasiun spesifik dengan perintah <code>/stasiun [keyword]</code>,
   misal. <code>stasiun cicayur</code>).\n
   • Gunakan huruf kapital untuk kode stasiun agar lebih mudah dibaca.
   `
}