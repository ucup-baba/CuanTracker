# PRD: CuanTracker - Aplikasi Keuangan Pribadi

## 1. Ringkasan

**CuanTracker** adalah aplikasi pencatatan keuangan pribadi berbasis web/PWA yang membantu pengguna mencatat pemasukan, pengeluaran, transfer antar dompet, utang/piutang, dan pengecekan saldo fisik secara cepat. Produk ini dirancang untuk pengguna Indonesia, menggunakan mata uang Rupiah, bahasa input sehari-hari, serta tampilan mobile-first yang ringan, ekspresif, dan mudah dipakai harian.

Selain kebutuhan personal finance, aplikasi juga dapat mendukung multi-dompet dan akses berbasis peran untuk konteks dana bersama seperti asrama, organisasi kecil, atau unit operasional.

## 2. Latar Belakang

Banyak pengguna gagal menjaga catatan keuangan karena proses input terlalu panjang, kategori tidak sesuai kebiasaan, dan ringkasan sulit dibaca. CuanTracker mengurangi hambatan tersebut dengan:

- Input transaksi manual yang cepat.
- Input natural language dengan AI, misalnya "kopi 15rb di asrama".
- Ringkasan saldo, pemasukan, pengeluaran, dan transfer yang langsung terlihat.
- Kategori dan sub-kategori yang dapat diatur sendiri.
- Fitur opname kas untuk mencocokkan saldo aplikasi dengan uang fisik.
- Fitur utang/piutang agar pinjaman pribadi tidak tercecer.
- Dashboard pengurus untuk melihat beberapa dompet/unit secara read-only.

## 3. Tujuan Produk

### 3.1 Tujuan Utama

- Membantu pengguna mencatat transaksi harian dalam waktu kurang dari 30 detik.
- Memberikan gambaran saldo, pemasukan, pengeluaran, dan transfer secara real-time.
- Membantu pengguna memahami pola pengeluaran berdasarkan kategori dan bulan.
- Menjaga catatan keuangan tetap akurat melalui cash match/opname kas.
- Memudahkan pencatatan utang dan piutang beserta cicilannya.

### 3.2 Tujuan Bisnis/Produk

- Menjadi aplikasi personal finance sederhana yang cocok untuk pengguna Indonesia.
- Mendukung penggunaan pribadi dan dana bersama dengan multi-dompet.
- Mengurangi kebutuhan spreadsheet manual untuk pencatatan keuangan kecil.
- Mendorong kebiasaan mencatat transaksi dengan bantuan AI dan UX mobile-first.

## 4. Non-Goals

- Tidak menjadi aplikasi akuntansi lengkap.
- Tidak menyediakan rekomendasi investasi atau nasihat finansial bersifat profesional.
- Tidak melakukan sinkronisasi otomatis dengan bank/e-wallet pada MVP.
- Tidak melakukan budgeting kompleks berbasis envelope pada MVP.
- Tidak menyediakan multi-currency pada MVP.

## 5. Persona Pengguna

### 5.1 Pengguna Pribadi

Pengguna yang ingin mencatat keuangan sehari-hari, memantau saldo pribadi, melihat pengeluaran terbesar, dan mengelola utang/piutang sederhana.

### 5.2 Pengelola Dana Bersama

Pengguna yang mengelola uang bersama, seperti kas asrama, kas komunitas, atau dana operasional kecil. Pengguna perlu memisahkan transaksi berdasarkan dompet dan kategori.

### 5.3 Pengurus/Admin

Pengguna yang perlu memantau ringkasan beberapa unit/dompet tanpa selalu melakukan input transaksi. Admin juga dapat menyetujui akses pengurus.

## 6. Problem Statement

Pengguna membutuhkan cara yang cepat, jelas, dan fleksibel untuk mencatat transaksi keuangan harian. Solusi yang ada sering terlalu formal, terlalu rumit, atau tidak sesuai konteks Indonesia seperti penggunaan "rb", "jt", "iuran", "kas", "opname", dan pencatatan dana bersama.

## 7. Value Proposition

CuanTracker membuat pencatatan uang terasa ringan: pengguna dapat mencatat transaksi dengan bahasa biasa, melihat kondisi saldo secara langsung, memecah data berdasarkan dompet/kategori, dan memverifikasi uang fisik dengan catatan aplikasi.

## 8. Scope MVP

### 8.1 Fitur Wajib MVP

- Login dengan Google dan email/password terbatas.
- Multi-dompet: Pribadi dan Asrama sebagai contoh awal.
- Transaksi pemasukan, pengeluaran, dan transfer antar dompet.
- Kategori dan sub-kategori untuk pemasukan/pengeluaran.
- Dashboard saldo total, pemasukan, pengeluaran, dan transfer.
- Daftar transaksi dengan edit, hapus, cari, filter tanggal, dan load more.
- Ringkasan kategori untuk pemasukan, pengeluaran, dan transfer.
- Pengaturan kategori: tambah, hapus, ubah ikon, ubah warna, ubah sub-kategori, dan urutkan.
- Opname kas/cash match.
- Utang/piutang.
- AI quick input untuk mengubah bahasa natural menjadi transaksi terstruktur.
- AI assistant untuk tanya jawab berbasis ringkasan keuangan.
- PWA install banner dan dukungan mobile-first.

### 8.2 Fitur Nice-to-Have MVP

- Catatan bulanan dan perbandingan bulan sebelumnya.
- Dashboard read-only untuk pengurus.
- Export/laporan PDF mingguan.
- Tema/skin UI.

## 9. User Stories

- Sebagai pengguna, saya ingin login dengan akun saya agar data transaksi saya aman.
- Sebagai pengguna, saya ingin mencatat pengeluaran dengan nominal, dompet, kategori, sub-kategori, dan tanggal agar riwayat keuangan saya lengkap.
- Sebagai pengguna, saya ingin mencatat transaksi dengan kalimat singkat agar tidak perlu mengisi form panjang.
- Sebagai pengguna, saya ingin memindahkan uang antar dompet agar saldo tiap dompet tetap akurat.
- Sebagai pengguna, saya ingin melihat total saldo, pemasukan, dan pengeluaran agar tahu kondisi keuangan saat ini.
- Sebagai pengguna, saya ingin mencari transaksi berdasarkan nama/kategori agar mudah menemukan catatan lama.
- Sebagai pengguna, saya ingin melihat kategori pengeluaran terbesar agar tahu sumber keborosan.
- Sebagai pengguna, saya ingin mengubah kategori sesuai kebutuhan saya agar aplikasi cocok dengan kebiasaan saya.
- Sebagai pengguna, saya ingin mencatat utang/piutang dan pembayaran cicilan agar tidak lupa kewajiban atau tagihan.
- Sebagai pengguna, saya ingin mencocokkan saldo aplikasi dengan uang fisik agar tahu apakah ada transaksi yang belum tercatat.
- Sebagai pengurus, saya ingin melihat ringkasan beberapa dompet/unit agar dapat memantau dana bersama.
- Sebagai admin, saya ingin menyetujui atau memblokir akses pengurus agar data tetap terkontrol.

## 10. Requirement Fungsional

### 10.1 Autentikasi dan Role

**Deskripsi:** Pengguna dapat masuk ke aplikasi menggunakan Google login atau email/password tertentu. Role ditentukan berdasarkan email pengguna.

**Requirement:**

- Sistem harus mendukung login Google.
- Sistem harus mendukung login email/password untuk akun tertentu.
- Sistem harus menentukan role pengguna berdasarkan email.
- Jika satu email memiliki beberapa role, sistem harus menampilkan role picker.
- Role minimal:
  - `putra`: akses dompet pribadi dan asrama.
  - `putri`: akses dompet asrama putri.
  - `logistik`: akses dompet logistik.
  - `pengurus`: akses dashboard pemantauan.
  - `admin`: akses approval pengurus.
- Pengurus non-admin harus masuk status pending sampai disetujui admin.

### 10.2 Dashboard Keuangan

**Deskripsi:** Halaman utama menampilkan ringkasan kondisi keuangan.

**Requirement:**

- Menampilkan total saldo.
- Menampilkan total pemasukan.
- Menampilkan total pengeluaran.
- Menampilkan total transfer.
- Kartu ringkasan dapat diklik untuk membuka breakdown kategori.
- Data harus mengikuti filter dompet, filter tanggal, dan pencarian.
- Saldo dihitung sebagai pemasukan dikurangi pengeluaran.
- Transfer antar dompet tidak mengubah total saldo saat melihat semua dompet, tetapi dihitung sebagai masuk/keluar saat melihat satu dompet tertentu.

### 10.3 Manajemen Transaksi

**Deskripsi:** Pengguna dapat membuat, membaca, mengubah, dan menghapus transaksi.

**Requirement:**

- Pengguna dapat membuat transaksi bertipe:
  - `income`
  - `expense`
  - `transfer`
- Field transaksi non-transfer:
  - keterangan
  - nominal
  - tipe
  - dompet
  - kategori
  - sub-kategori
  - tanggal
- Field transaksi transfer:
  - keterangan opsional
  - nominal
  - dompet asal
  - dompet tujuan
  - tanggal
- Sistem harus memvalidasi nominal lebih dari 0.
- Sistem harus memvalidasi kategori dan sub-kategori untuk transaksi non-transfer.
- Sistem harus menolak transfer jika dompet asal dan tujuan sama.
- Pengguna dapat mengedit transaksi yang sudah dibuat.
- Pengguna dapat menghapus transaksi dengan konfirmasi.
- Daftar transaksi harus diurutkan dari tanggal terbaru, lalu waktu dibuat terbaru.

### 10.4 Mode E-Money

**Deskripsi:** Mode e-money membantu mencatat pengeluaran yang tidak mengurangi uang tunai fisik.

**Requirement:**

- Mode e-money tersedia untuk pengeluaran dompet pribadi/putri.
- Saat aktif, sistem membuat dua transaksi:
  - pemasukan offset ke kategori transfer masuk/lain-lain masuk.
  - pengeluaran sesuai kategori yang dipilih.
- Tujuan mode ini adalah menjaga saldo kas fisik tetap sesuai saat pembayaran dilakukan menggunakan e-money.

### 10.5 Input Cepat AI

**Deskripsi:** Pengguna dapat mengetik transaksi dengan bahasa natural dan sistem mengisi transaksi secara otomatis.

**Requirement:**

- Sistem harus menerima input seperti:
  - "kopi 15rb"
  - "beli beras 120rb di asrama"
  - "iuran masuk 300rb"
- Sistem harus mengenali format nominal Indonesia:
  - `rb`, `ribu`, `k`
  - `jt`, `juta`, `m`
- Sistem harus memilih tipe, dompet, kategori, sub-kategori, nominal, dan keterangan.
- Jika AI gagal, sistem harus memakai fallback lokal untuk parsing nominal dan kategori sederhana.
- Sistem harus mendukung mode simpan otomatis.
- Pada mode simpan otomatis, sistem boleh menyimpan beberapa transaksi valid sekaligus.
- Jika data tidak cukup valid, sistem harus mengisi form untuk direview manual.

### 10.6 AI Assistant

**Deskripsi:** Pengguna dapat bertanya tentang kondisi keuangannya.

**Requirement:**

- AI assistant harus menjawab berdasarkan ringkasan agregat, bukan seluruh raw transaction rows.
- AI assistant dapat menjawab pertanyaan seperti:
  - "bulan ini boros di mana?"
  - "saldo riil saya berapa?"
  - "pengeluaran terbesar apa?"
- AI assistant harus membedakan cashflow riil dan transfer internal.
- Jika opsi "boleh catat transaksi" aktif, AI assistant dapat mengubah percakapan menjadi transaksi.
- Transaksi yang dibuat AI harus divalidasi terhadap daftar dompet, kategori, dan sub-kategori yang tersedia.

### 10.7 Kategori dan Sub-Kategori

**Deskripsi:** Pengguna dapat menyesuaikan kategori sesuai kebiasaan.

**Requirement:**

- Pengguna dapat mengelola kategori pemasukan dan pengeluaran secara terpisah.
- Setiap kategori memiliki:
  - nama
  - ikon
  - warna
  - daftar sub-kategori
- Pengguna dapat tambah kategori baru.
- Pengguna dapat hapus kategori.
- Pengguna dapat tambah/hapus sub-kategori.
- Pengguna dapat mengganti ikon dan warna kategori.
- Pengguna dapat mengurutkan kategori dengan drag and drop.
- Sistem harus menampilkan peringatan jika ada perubahan kategori yang belum disimpan.

### 10.8 Pencarian, Filter, dan Pagination

**Requirement:**

- Pengguna dapat mencari transaksi berdasarkan:
  - keterangan
  - kategori
  - sub-kategori
- Pengguna dapat filter tanggal:
  - semua
  - hari ini
  - minggu ini
  - bulan ini
- Daftar transaksi awal menampilkan 20 transaksi.
- Pengguna dapat memuat 20 transaksi tambahan per klik.

### 10.9 Ringkasan Kategori

**Requirement:**

- Sistem menampilkan breakdown pemasukan, pengeluaran, dan transfer.
- Breakdown menampilkan total, persentase, progress bar, jumlah transaksi, dan daftar transaksi per sub-kategori.
- Pengguna dapat expand/collapse kategori dan sub-kategori.
- Transfer harus dikelompokkan berdasarkan arah transfer.

### 10.10 Perbandingan Bulanan

**Requirement:**

- Pengguna dapat memilih bulan dan tahun.
- Sistem menampilkan pemasukan, pengeluaran, dan saldo bulan terpilih.
- Sistem membandingkan angka bulan terpilih dengan bulan sebelumnya.
- Sistem menampilkan breakdown kategori untuk bulan terpilih.
- Pengguna dapat menulis catatan bulanan.
- Catatan bulanan tersimpan per bulan/tahun.

### 10.11 Opname Kas/Cash Match

**Deskripsi:** Pengguna dapat mencocokkan saldo aplikasi dengan uang fisik.

**Requirement:**

- Sistem menampilkan saldo aplikasi saat ini.
- Pengguna memasukkan saldo uang fisik.
- Sistem menghitung selisih.
- Sistem menandai status:
  - pas
  - lebih
  - kurang
- Pengguna dapat menyimpan log pengecekan.
- Pengguna dapat melihat riwayat pengecekan.

### 10.12 Utang dan Piutang

**Requirement:**

- Pengguna dapat mencatat utang baru.
- Pengguna dapat mencatat piutang baru.
- Field utang/piutang:
  - tipe
  - nama pihak
  - jumlah awal
  - sisa
  - catatan
  - tanggal
  - status
  - riwayat pembayaran
- Sistem otomatis membuat transaksi terkait saat utang/piutang dibuat.
- Sistem otomatis membuat transaksi terkait saat cicilan/pembayaran dicatat.
- Sistem menandai status lunas jika sisa menjadi 0.

### 10.13 Dashboard Pengurus

**Deskripsi:** Dashboard pengurus menampilkan ringkasan multi-unit secara read-only.

**Requirement:**

- Pengurus dapat melihat ringkasan saldo gabungan.
- Pengurus dapat melihat saldo unit:
  - asrama putra
  - asrama putri
  - logistik
- Pengurus dapat berpindah tab unit.
- Pengurus dapat melihat daftar transaksi read-only.
- Pengurus dapat filter tanggal dan mencari transaksi.
- Pengurus dapat melihat breakdown kategori.
- Admin dapat melihat dan mengelola request akses pengurus.

### 10.14 PWA dan Mobile Experience

**Requirement:**

- Aplikasi dapat diinstall sebagai PWA.
- Sistem menampilkan install prompt jika tersedia.
- Tampilan harus mobile-first.
- Bottom navigation tersedia untuk akses cepat.
- UI harus tetap nyaman di layar kecil.
- Status bar browser/mobile harus mengikuti tema role.

### 10.15 Laporan PDF

**Requirement:**

- Sistem dapat menghasilkan laporan mingguan.
- Laporan berisi:
  - periode laporan
  - total pemasukan
  - total pengeluaran
  - saldo
  - breakdown kategori
- Pada MVP, upload otomatis ke Google Drive dapat dinonaktifkan jika credential belum tersedia.

## 11. Data Model

### 11.1 Transaction

```json
{
  "id": "string",
  "text": "string",
  "amount": 50000,
  "type": "income | expense | transfer",
  "wallet": "pribadi | asrama | putri | logistik",
  "fromWallet": "string|null",
  "toWallet": "string|null",
  "category": "string|null",
  "subCategory": "string|null",
  "date": "YYYY-MM-DD",
  "createdAt": 1710000000000,
  "isEmoney": false
}
```

### 11.2 Category Settings

```json
{
  "Nama Kategori": {
    "icon": "Coffee",
    "color": "bg-orange-400",
    "subCategories": ["Makan Berat", "Kopi & Jajan"]
  }
}
```

### 11.3 Cash Match

```json
{
  "id": "string",
  "date": "ISO datetime",
  "appBalance": 100000,
  "cashBalance": 95000,
  "difference": -5000
}
```

### 11.4 Debt

```json
{
  "id": "string",
  "type": "utang | piutang",
  "personName": "string",
  "amount": 100000,
  "remaining": 50000,
  "notes": "string",
  "date": "YYYY-MM-DD",
  "status": "active | lunas",
  "paymentHistory": [
    {
      "date": "YYYY-MM-DD",
      "amount": 50000,
      "timestamp": 1710000000000
    }
  ],
  "createdAt": 1710000000000
}
```

### 11.5 Pengurus User

```json
{
  "email": "user@example.com",
  "displayName": "string",
  "photoURL": "string",
  "status": "pending | approved | blocked",
  "requestedAt": "serverTimestamp"
}
```

## 12. Koleksi Firestore

- `globalTransactions`
- `putriTransactions`
- `logistikTransactions`
- `globalSettings`
- `putriSettings`
- `logistikSettings`
- `globalCashMatches`
- `putriCashMatches`
- `logistikCashMatches`
- `globalDebts`
- `putriDebts`
- `logistikDebts`
- `pengurusUsers`
- `globalMonthlyNotes`

## 13. Hak Akses

### 13.1 Prinsip

- Pengguna hanya dapat menulis data sesuai role.
- Pengurus dapat membaca data yang dibutuhkan untuk monitoring.
- Admin dapat menyetujui/memblokir akses pengurus.
- API key AI tidak boleh dikirim ke browser.

### 13.2 Akses Role

| Role | Read | Write |
| --- | --- | --- |
| Putra | Global transactions/settings/cash/debt | Global transactions/settings/cash/debt |
| Putri | Putri transactions/settings/cash/debt | Putri transactions/settings/cash/debt |
| Logistik | Logistik transactions/settings/cash/debt | Logistik transactions/settings/cash/debt |
| Pengurus | Ringkasan dan transaksi unit yang diizinkan | Tidak ada, kecuali request akses sendiri |
| Admin | Semua data monitoring dan request pengurus | Approval/block pengurus |

## 14. UX dan UI Direction

- Bahasa utama: Indonesia.
- Nada produk: ringan, santai, dan praktis.
- Tampilan: neo-brutalist/pop, border tebal, warna kontras, shadow tegas.
- Mobile-first, karena pencatatan transaksi paling sering dilakukan lewat ponsel.
- Form transaksi harus lebih dominan daripada dekorasi.
- Kartu saldo harus menjadi fokus pertama di dashboard.
- Warna tipe transaksi:
  - hijau untuk pemasukan
  - merah untuk pengeluaran
  - ungu untuk transfer
- Ikon kategori harus membantu scanning cepat.
- Setiap aksi destruktif harus memakai konfirmasi.

## 15. Requirement Non-Fungsional

### 15.1 Performance

- Dashboard awal harus dapat dirender dalam kurang dari 3 detik pada koneksi normal.
- Interaksi filter/search harus terasa instan untuk ratusan transaksi.
- AI assistant harus memakai ringkasan agregat agar payload tetap kecil.

### 15.2 Reliability

- Data transaksi harus realtime melalui Firestore listener.
- Gagal simpan harus menampilkan error yang jelas.
- AI gagal tidak boleh memblokir input manual.
- Fallback lokal harus tetap dapat membaca nominal sederhana.

### 15.3 Security

- Semua halaman utama hanya dapat diakses setelah login.
- Firestore rules harus membatasi read/write berdasarkan role.
- Secret AI hanya tersedia di Cloud Functions.
- Pengurus pending/blocked tidak boleh melihat dashboard.

### 15.4 Accessibility

- Tombol icon harus memiliki title/aria label.
- Kontras warna harus cukup untuk teks utama.
- Komponen penting harus dapat digunakan di mobile tanpa hover.

### 15.5 Localization

- Format mata uang menggunakan `id-ID` dan IDR.
- Tanggal menggunakan format Indonesia.
- Parser nominal mendukung "rb", "ribu", "k", "jt", "juta", dan "m".

## 16. Acceptance Criteria MVP

- Pengguna dapat login dan masuk ke role yang sesuai.
- Pengguna dapat membuat transaksi pengeluaran dengan kategori dan melihat saldo berubah.
- Pengguna dapat membuat transaksi pemasukan dan melihat total pemasukan berubah.
- Pengguna dapat membuat transfer antar dompet dan melihat saldo dompet asal/tujuan berubah sesuai konteks.
- Pengguna dapat mengedit dan menghapus transaksi.
- Pengguna dapat mencari transaksi dari keterangan/kategori/sub-kategori.
- Pengguna dapat membuka ringkasan kategori dari kartu dashboard.
- Pengguna dapat menambah kategori baru dan menyimpannya.
- Pengguna dapat melakukan cash match dan melihat riwayatnya.
- Pengguna dapat membuat utang/piutang dan mencatat pembayaran.
- AI quick input dapat mengisi form dari minimal 5 contoh kalimat umum.
- AI assistant dapat menjawab pertanyaan berbasis ringkasan data pengguna.
- Aplikasi dapat dibuild tanpa error.
- PWA dapat diinstall pada browser yang mendukung.

## 17. Metrics

- Jumlah transaksi yang dicatat per pengguna per minggu.
- Persentase transaksi yang dibuat melalui AI quick input.
- Waktu rata-rata membuat transaksi manual.
- Jumlah cash match per bulan.
- Jumlah pengguna yang mengubah kategori default.
- Retention mingguan pengguna aktif.
- Jumlah error simpan transaksi.
- Rasio pengurus pending yang disetujui admin.

## 18. Roadmap

### Phase 1: MVP Stabil

- Login dan role.
- CRUD transaksi.
- Dashboard saldo.
- Kategori dinamis.
- Search/filter.
- Cash match.
- Utang/piutang dasar.
- AI quick input dasar.
- PWA.

### Phase 2: Insight dan Reporting

- Perbandingan bulanan.
- Catatan bulanan.
- PDF report.
- Export CSV/PDF manual.
- Insight pengeluaran berulang.

### Phase 3: Automation

- Budget per kategori.
- Reminder transaksi rutin.
- Import transaksi dari CSV.
- Integrasi bank/e-wallet jika memungkinkan.
- Notifikasi saat pengeluaran kategori melewati ambang batas.

### Phase 4: Multi-User Finance

- Team/household wallet.
- Permission granular per dompet.
- Audit log perubahan transaksi.
- Approval transaksi untuk dana bersama.

## 19. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Parsing AI salah kategori | Transaksi tersimpan keliru | Validasi kategori, review manual jika confidence rendah |
| Firestore rules terlalu longgar | Data bisa terbaca user tidak tepat | Audit rules dan uji dengan emulator |
| Kategori dihapus saat transaksi lama masih memakai kategori itu | Riwayat sulit dianalisis | Simpan label kategori di transaksi, bukan hanya reference |
| Pengguna lupa mencatat | Data saldo tidak akurat | AI quick input, cash match, reminder |
| Transfer internal disalahartikan sebagai pemasukan riil | Insight salah | Pisahkan total dashboard dan real cashflow |
| Utang/piutang hardcoded ke dompet pribadi | Tidak fleksibel untuk role lain | Tambahkan pilihan dompet pada form utang/piutang |

## 20. Open Questions

- Apakah aplikasi akan tetap memakai daftar email hardcoded atau pindah ke manajemen user berbasis admin UI?
- Apakah data pribadi dan dana bersama harus benar-benar dipisah dalam project Firebase yang berbeda?
- Apakah fitur pengurus hanya read-only atau perlu approval transaksi?
- Apakah perlu budget bulanan per kategori pada versi pertama?
- Apakah laporan PDF harus otomatis dikirim ke Drive/email?
- Apakah AI boleh menyimpan transaksi otomatis secara default, atau harus selalu opt-in?
- Apakah dompet bisa dibuat bebas oleh pengguna, atau tetap predefined?

## 21. Definition of Done

- Requirement MVP selesai dan diuji secara manual pada desktop dan mobile.
- Build production berhasil.
- Firestore rules sudah diuji untuk role utama.
- Tidak ada secret API di frontend.
- Setiap fitur simpan/hapus memiliki feedback error/sukses.
- Dokumentasi kategori, role, dan koleksi Firestore tersedia.
- PRD ini diperbarui jika scope produk berubah.
