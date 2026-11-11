# 🛒 Website Toko Kaos — Dola Kaos

## Cara Pasang

### 1. Google Sheets
- Buka sheets.google.com → buat baru → nama: "Data Toko Kaos"
- Buat 3 tab: Produk, SlideBeranda, Pesanan
- Buka Ekstensi → Apps Script → tempel kode Apps Script → Simpan

### 2. Deploy Apps Script
- Klik Deploy → Aplikasi Web
- Versi baru → Siapa saja, bahkan anonim → Deploy
- Salin URL yang muncul → tempel di API_URL di script.js & admin-script.js

### 3. GitHub Hosting
- Buat repo baru → upload semua file
- Settings → Pages → Branch: main → Save
- Selesai! Website online

### 4. Upload Gambar & Video
- Taruh file gambar/video di GitHub repo kamu
- Klik kanan → Copy link alamat (pastikan mulai raw.githubusercontent.com)
- Tempel link tersebut di:
  - index.html → tag <video> src
  - Admin Panel → saat tambah produk/slide, masukkan link tersebut

### 5. Edit Info Toko
- script.js → ubah nomor WhatsApp: 6281234567890 → ganti nomor kamu
- index.html → footer link sosmed
-
