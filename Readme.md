# 🚂 Bot Telegram Jadwal KRL Jabodetabek

Bot Telegram yang menyediakan informasi jadwal Kereta Rel Listrik (KRL) Jabodetabek secara real-time. Bot ini menggunakan data resmi dari PT KAI dan menyediakan fitur pencarian jadwal kereta berikutnya serta informasi stasiun.

## 🔗 Links

- **Source Data PDF**: [Commuter Line Jabbodetabek PDF](https://commuterline.id/files/download/documents/Commuter%20Line%20Jabodetabek%20-Mulai%201%20Februari%202025-.pdf)
- **Telegram Bot**: [Jadwal KRL Jabbodetabek](https://t.me/comline_schedule_bot)
- **Google Sheets Data**: [Link Google Sheet](https://docs.google.com/spreadsheets/d/1Ow4cYbWbz-zCV0PXo5qJXCOwQx6uKYJHmCMhcr7_DVA/edit?usp=sharing)

## ✨ Fitur

- 🔍 **Pencarian Jadwal**: Cari kereta berikutnya dari stasiun tertentu
- 🎯 **Filter Tujuan**: Filter kereta berdasarkan stasiun tujuan
- ⏰ **Waktu Fleksibel**: Pencarian berdasarkan waktu tertentu atau menit ke depan
- 📍 **Info Stasiun**: Daftar lengkap stasiun dengan kode dan alias
- ⚡ **Response Cepat**: Powered by Google Apps Script untuk performa optimal

## 🏗️ Arsitektur Sistem

### Alur Data (Data Flow)

```
PDF Schedule (KAI) → Raw CSV → Normalized Data → Master Sheet → Telegram Bot
```

1. **📄 Sumber Data PDF**: Mendapatkan jadwal dari PDF resmi yang diberikan PT KAI
2. **📊 Konversi ke CSV**: Mengubah data PDF menjadi format CSV (Raw Data)
3. **🔄 Normalisasi Data**: Memproses raw data menjadi format normalized menggunakan Apps Script
4. **📋 Master Sheet**: Menggabungkan semua normalized sheets menjadi 1 sheet utama
5. **🚉 Station Sheet**: Membuat sheet stasiun berisi kode stasiun, nama stasiun, dan alias

### Teknologi

- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **API**: Telegram Bot API
- **Runtime**: Google Cloud Platform

## 📁 Struktur Proyek

```
jadwal-krl-jabodetabek/
├── 1. Source Data/                    # Data PDF dari KAI
├── 2. Raw Data/                    # Data CSV mentah dari konversi PDF
│   ├── RAW_Rangkas - Tanah Abang.csv
│   ├── RAW_Cikarang - Kp Bandan.csv
│   ├── RAW_Kp Bandan - Cikarang.csv
│
├── 3. Appsheet Code/               # Kode Google Apps Script
│   ├── Telegram.gs                 # Handler utama Telegram Bot
│   ├── Utils.gs                    # Utility functions
│   ├── DataOperation.gs            # Operasi data dan query
│   ├── SheetOperation.gs           # Operasi Google Sheets
│   └── Command/                    # Handler untuk command bot
│       ├── Next.gs                 # Command /next untuk jadwal
│       ├── Stasiun.gs             # Command /stasiun untuk info stasiun
│       └── Help.gs                # Command /help
│
└── README.md
```

## 📖 Cara Penggunaan Bot

### Command `/next` - Cari Jadwal Kereta

**Format**: `/next [stasiun] [tujuan] [waktu/menit] [limit]`

**Contoh penggunaan**:
```
/next                           # Default: kereta berikutnya dari BKS
/next CC                        # Kereta berikutnya dari Cawang (CC)
/next CC THB                    # Kereta dari Cawang ke Tanah Abang
/next CC THB 10                 # Kereta dari Cawang ke Tanah Abang 10 menit ke depan
/next CC THB 07:30              # Kereta dari Cawang ke Tanah Abang mulai jam 07:30
/next CC THB 10 3               # Kereta dari Cawang ke Tanah Abang 10 menit ke depan, maksimal 3 hasil
```

**Parameter**:
- `stasiun`: Kode stasiun keberangkatan (contoh: CC, BKS, THB)
- `tujuan`: Kode stasiun tujuan (opsional)
- `waktu/menit`: Format `HH:MM` untuk waktu tertentu atau angka untuk menit ke depan
- `limit`: Maksimal jumlah hasil yang ditampilkan (default: 5)

### Command `/stasiun` - Info Stasiun

**Format**: `/stasiun [filter] [halaman]`

**Contoh penggunaan**:
```
/stasiun                        # Semua stasiun halaman 1
/stasiun 2                      # Semua stasiun halaman 2
/stasiun bekasi                 # Filter stasiun yang mengandung "bekasi"
/stasiun bekasi 2               # Filter "bekasi" halaman 2
```

### Command `/help` - Bantuan

Menampilkan panduan penggunaan bot.

## ⚙️ Setup dan Deployment

### Prerequisites
- Akun Google (untuk Google Apps Script & Sheets)
- Token Telegram Bot dari [@BotFather](https://t.me/BotFather)

### Langkah Setup

1. **Buat Bot Telegram**
   - Chat dengan [@BotFather](https://t.me/BotFather)
   - Jalankan `/newbot` dan ikuti instruksi
   - Simpan token bot yang diberikan

2. **Setup Google Sheets**
   - Buat Google Spreadsheet baru
   - Import data CSV ke dalam sheets terpisah
   - Buat sheet "STATIONS" dengan kolom: Code, Name, Alias
   - Buat sheet "MASTER_NORMALIZED" untuk data gabungan

3. **Deploy Apps Script**
   - Buka Google Apps Script (script.google.com)
   - Buat project baru dan copy semua file dari folder `3. Appsheet Code/`
   - Set variabel environment:
     ```javascript
     const TG_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
     const MASTER_NORMALIZED_SHEET = 'MASTER_NORMALIZED';
     const STATIONS_SHEET = 'STATIONS';
     ```

4. **Setup Webhook**
   - Deploy Apps Script sebagai Web App
   - Set permissions: "Anyone, even anonymous"
   - Copy deployment URL
   - Set webhook Telegram: `https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<DEPLOYMENT_URL>`

## 📊 Format Data

### Raw Data CSV
```csv
No,Nomor KA,Relasi,RK,CTR,MJ,CKY,TGS,TEJ,DAR,CJT,PRP,CC,CSK,SRP,RU,SDM,JMU,PDJ,KBY,PLM,THB,Keterangan
1,1613,Prp-Thb,,,,,,,,,03:51,03:58,04:02,04:06,04:10,04:15,04:18,04:21,04:29,04:35,04:40,
```

### Normalized Data
Data yang telah dinormalisasi dengan kolom:
- No: Nomor urut
- Nomor KA: Nomor kereta api
- Relasi: Rute kereta (contoh: "Prp-Thb")
- Stasiun: Kode stasiun
- Waktu: Waktu kedatangan

### Station Data
- Code: Kode stasiun (contoh: "CC", "BKS")
- Name: Nama lengkap stasiun (contoh: "Cawang", "Bekasi")
- Alias: Alias stasiun untuk pencarian (contoh: "cawang, cwg")

## > Kontribusi

Kontribusi sangat diterima! Beberapa cara untuk berkontribusi:

1. **Data Update**: Membantu update data jadwal terbaru
2. **Feature Enhancement**: Menambah fitur baru pada bot
3. **Bug Fixes**: Memperbaiki bug yang ditemukan
4. **Documentation**: Memperbaiki dan menambah dokumentasi

### Guidelines
- Fork repository ini
- Buat branch untuk feature/fix Anda
- Commit dengan pesan yang jelas
- Buat pull request dengan deskripsi lengkap

## 📜 Lisensi

Project ini menggunakan data resmi dari PT KAI dan dibuat untuk kepentingan publik. Silakan gunakan dengan bijak.

## 📞 Contact & Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini atau hubungi maintainer.

---

**Disclaimer**: Bot ini tidak berafiliasi resmi dengan PT KAI. Data jadwal dapat berubah sewaktu-waktu. Selalu konfirmasi jadwal dengan sumber resmi untuk perjalanan penting.
