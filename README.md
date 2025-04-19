# Live Streaming App - StreamHib

Aplikasi live streaming lengkap dengan fitur manajemen video, sesi live, jadwal live streaming, dan monitoring sistem.

## Fitur Utama

- Download video dari Google Drive dengan nama file asli (menggunakan Google Drive API)
- Manajemen video: rename, hapus
- Mulai sesi live streaming (YouTube/Facebook)
- Kelola sesi live aktif: stop
- Jadwalkan live streaming dengan tanggal dan durasi
- Kelola jadwal live streaming: batalkan
- Kelola sesi live tidak aktif: restart, hapus
- Monitoring penggunaan CPU, memori, dan disk di header aplikasi

## Instalasi dan Menjalankan di Server VPS Ubuntu

1. **Install Node.js dan npm**

```bash
sudo apt update
sudo apt install nodejs npm -y
```

2. **Clone repositori**

```bash
git clone https://github.com/masdonik/live-streaming-app.git
cd live-streaming-app
```

3. **Install dependensi**

```bash
npm install
```

4. **Jalankan aplikasi**

```bash
npm start
```

5. **Akses aplikasi**

Buka browser dan akses:

```
http://<IP-VPS>:3000
```

6. **Pengaturan API Key Google Drive**

- Klik tombol **Settings** di header aplikasi.
- Masukkan API Key Google Drive dari Google Cloud Console.
- Simpan untuk mendapatkan nama file asli saat download video dari Google Drive.

## Catatan

- Aplikasi ini menggunakan API Google Drive untuk mengambil nama file asli, pastikan API key sudah diaktifkan dan memiliki akses yang diperlukan.
- Aplikasi ini masih menggunakan penyimpanan data sementara (in-memory), sehingga data akan hilang saat server dimatikan. Untuk produksi, perlu integrasi database.

## Lisensi

MIT License

---

Dibuat oleh masdonik
