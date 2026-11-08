# 📋 Panduan & Checklist Pengujian E-Learning & CBT
**SMP Negeri 3 Cihampelas (Spentic)**

Dokumen ini memuat panduan langkah demi langkah serta lembar uji (*checklist*) untuk memverifikasi seluruh modul E-Learning dan Asesmen CBT, baik di lingkungan lokal (`localhost:3000`) maupun domain live (`.sch.id`).

---

## 🔑 1. Kredensial Akun Pengujian

| Peran (Role) | Tab Portal Login | Username / NIP / NISN | Password Default | Akses Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Guru Mapel** | `Guru Mata Pelajaran` | `rohidin` *(atau `dedeh.komalasari`)* | `guru123` *(atau `spentic2026`)* | Presensi, Tugas, Penilaian, Bank Soal CBT |
| **Siswa Demo** | `Peserta Didik` | `0133138158` *(Abdul Hanan - 7-A)* | `siswa123` *(atau `spentic2026`)* | Presensi Saya, Pengumpulan Tugas, Ujian CBT |
| **Meja Piket** | `Stasiun Meja Piket` | Bebas *(contoh: `Piket 1`)* | `piket123` | Rekap Live Seluruh Rombel, Matriks Bulanan |
| **Panitia CBT** | `Panitia Asesmen CBT` | `panitia` *(atau `poskocbt`)* | `panitia123` | Command Center, Rilis Token, Reset Sesi, Rekap Nilai |

> **Metode Pengujian Multi-Role:** Gunakan jendela browser reguler untuk login **Guru/Panitia**, dan jendela **Incognito / Private Window** (`Ctrl + Shift + N`) untuk login **Siswa**. Hal ini mencegah sesi login saling menimpa di `localStorage`.

---

## 🚀 2. Checklist Alur Pengujian

### 🟢 FASE 1: Presensi Kelas & Rekap Laporan (Guru Mapel ↔ Meja Piket)
- [ ] **1.1. Login Guru Mapel:** Buka tab *Guru Mata Pelajaran*, masukkan username `rohidin` dan password `guru123`.
- [ ] **1.2. Pemilihan Kelas & Mapel:** Pilih rombel **7-A** dan pastikan tanggal mengarah ke hari ini.
- [ ] **1.3. Uji Aksi Cepat Presensi:** Klik tombol **"Set Semua Hadir"** -> pastikan seluruh siswa aktif berganti status menjadi `H` (Hadir).
- [ ] **1.4. Uji Status Individual:** Ubah salah satu siswa menjadi status `S` (Sakit), `I` (Izin), `A` (Alpa), atau `T` (Terlambat).
- [ ] **1.5. Input Catatan Keterangan:** Tulis keterangan pada kolom catatan siswa (contoh: *"Dispensasi lomba OSIS"*).
- [ ] **1.6. Simpan Presensi:** Klik tombol **"Simpan Presensi / Sesi Pembelajaran"** -> pastikan notifikasi sukses muncul.
- [ ] **1.7. Verifikasi Laporan Presensi:** Buka tab **Laporan Presensi** -> periksa kesesuaian data pada mode:
  - [ ] Rekap Harian
  - [ ] Matriks Bulanan
  - [ ] Rekap Semester
- [ ] **1.8. Uji Fitur Export Excel:** Klik tombol **Export ke Excel** -> periksa file `.xlsx` yang terunduh di perangkat.
- [ ] **1.9. Verifikasi di Meja Piket:** Buka jendela browser lain, login ke tab *Stasiun Meja Piket* (`piket123`) -> periksa tab **Live Monitoring** apakah rekap rombel 7-A hari ini langsung ter-update otomatis secara real-time.

---

### 🔵 FASE 2: Penugasan & Penilaian (Guru ↔ Siswa)
- [ ] **2.1. Guru Membuat Tugas Baru:** Di akun Guru, buka tab **Tugas** -> klik **"Buat Tugas Baru"**.
  - Masukkan judul: `[UJI COBA] Latihan Soal Bab 1`
  - Pilih kelas target: **7-A**
  - Tentukan tenggat waktu (*deadline*) dan petunjuk pengerjaan
  - Klik **Simpan Tugas**.
- [ ] **2.2. Siswa Mengakses Tugas:**
  - Di jendela Incognito, buka portal e-learning -> pilih tab *Peserta Didik*.
  - Login via shortcut tombol **"1-Click Quick Login Siswa (Abdul Hanan)"** atau input manual NISN: `0133138158` / pass: `siswa123`.
  - Masuk ke tab menu **Tugas & Pekerjaan Rumah** -> buka tugas `[UJI COBA]`.
- [ ] **2.3. Siswa Mengumpulkan Jawaban:**
  - Klik tombol **"Kirim Tugas"**.
  - Ketik jawaban teks atau lampirkan berkas dokumen/gambar simulasi -> klik **Kirim**.
- [ ] **2.4. Verifikasi Status Pengumpulan:** Pastikan status tugas di akun siswa berubah menjadi *"Telah Dikumpulkan (Menunggu Penilaian)"*.
- [ ] **2.5. Guru Memeriksa & Menilai Submission:**
  - Kembali ke browser akun Guru di tab **Tugas** -> klik tombol **"Lihat Pengumpulan"**.
  - Klik nama **Abdul Hanan**.
  - Berikan nilai (misal: `95`) dan catatan feedback (misal: *"Analisis sangat runtut dan baik!"*) -> klik **Simpan Nilai**.
- [ ] **2.6. Siswa Menerima Hasil Penilaian:**
  - Refresh dashboard siswa -> pastikan status tugas berubah menjadi *"Dinilai: 95/100"* disertai catatan dari guru.
- [ ] **2.7. Pembersihan Data (*Clean-Up*):**
  - Di akun Guru, klik tombol **Hapus** pada tugas uji coba tersebut agar database sekolah tetap bersih.

---

### 🟣 FASE 3: Simulasi Asesmen CBT (Panitia ↔ Siswa ↔ Pengawas)
- [ ] **3.1. Panitia Menyiapkan Token Ujian:**
  - Login sebagai **Panitia Asesmen CBT** (username: `panitia`, password: `panitia123`).
  - Di **Command Center**, periksa paket ujian aktif lalu buat/rilis **Token Ujian** (misal: kombinasi 5–6 digit).
- [ ] **3.2. Siswa Memasuki Bilik Ujian CBT:**
  - Di akun Siswa, masuk ke menu **Asesmen CBT**.
  - Pilih paket ujian yang sedang dibuka, ketik Token Ujian dari Panitia, lalu klik **Mulai Ujian**.
- [ ] **3.3. Pengerjaan Soal di Bilik Ujian (`CbtStudentExamRoom`):**
  - [ ] Periksa jalannya **Countdown Timer** (waktu mundur).
  - [ ] Pilih opsi jawaban pilihan ganda (A/B/C/D).
  - [ ] Uji tombol **"Ragu-ragu"** -> pastikan nomor soal pada kisi navigasi berubah warna menjadi kuning/oranye.
  - [ ] Klik kisi nomor soal lain untuk melompat antar nomor soal secara acak.
- [ ] **3.4. Selesai & Kirim Ujian:**
  - Pada soal terakhir, klik tombol **"Selesai & Kumpulkan Ujian"** -> setujui dialog konfirmasi akhir.
- [ ] **3.5. Monitoring Panitia / Pengawas:**
  - Di Command Center Panitia, pantau status siswa yang berganti dari *"Sedang Mengerjakan"* menjadi *"Selesai"*.
- [ ] **3.6. Uji Fitur Reset Sesi:**
  - Coba klik tombol **"Reset Sesi Siswa"** di tabel monitoring panitia (berguna jika peserta mengalami kendala perangkat mendadak dan perlu masuk ulang).
- [ ] **3.7. Rekap Nilai Hasil CBT:**
  - Buka tab **Rekap Nilai CBT** di Command Center Panitia -> pastikan nilai otomatis terhitung dan coba tombol **Export Hasil CBT ke Excel**.

---

### 🟡 FASE 4: Validasi & Uji Tampilan Mobile
- [ ] **4.1. Uji Validasi Password Salah:** Sengaja masukkan kata sandi salah (misal: `12345`) pada portal login -> pastikan muncul notifikasi *toast error/peringatan* yang jelas tanpa memicu crash.
- [ ] **4.2. Uji Status Siswa Keluar (K):** Pastikan siswa dengan status 'K' (Keluar / Pindah) tidak ikut berubah menjadi hadir saat tombol "Set Semua Hadir" ditekan.
- [ ] **4.3. Uji Responsivitas Mobile:**
  - Buka via ponsel atau tekan tombol `F12` (Toggle Device Toolbar / 375px–412px).
  - Pastikan tabel presensi dapat digeser secara horizontal (*scrollable*).
  - Pastikan tombol navigasi nomor soal CBT mudah disentuh dengan jari.

---

## 📌 Catatan Pengujian di Domain Resmi (`.sch.id`)

1. **Gunakan Label Khusus:** Selalu gunakan awalan `[UJI COBA]` pada judul tugas atau materi agar siswa/guru asli tidak bingung.
2. **Gunakan Akun Siswa Demo:** Utamakan pengujian menggunakan akun demo **Abdul Hanan (7-A)**.
3. **Hapus Data Testing:** Segera hapus tugas atau paket soal simulasi setelah pengetesan selesai dilakukan.

