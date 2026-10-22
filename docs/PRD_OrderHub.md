# Product Requirements Document — OrderHub

## 1. Ringkasan

OrderHub adalah aplikasi back-office untuk mengelola katalog produk, data pelanggan, dan transaksi penjualan. Aplikasi ditujukan untuk admin operasional toko yang membutuhkan data stok dan histori order yang konsisten.

Dokumen ini merangkum kebutuhan produk, alur utama, batasan teknis, dan kriteria penerimaan berdasarkan technical test Azatech.

## 2. Tujuan produk

- Memudahkan admin mengelola produk dan stok.
- Menyediakan data pelanggan yang dapat dipakai saat membuat order.
- Mencegah transaksi dengan stok tidak cukup.
- Menjaga akurasi histori melalui snapshot harga saat order dibuat.
- Menyediakan dashboard ringkas untuk transaksi, penjualan, produk terlaris, dan stok menipis.

## 3. Pengguna dan kebutuhan

### Admin toko

Admin dapat login, melihat ringkasan toko, mengelola produk dan pelanggan, membuat order, melihat detail transaksi, serta mengekspor histori order.

## 4. Ruang lingkup

### In scope

- JWT login, refresh token, logout, dan profil admin.
- CRUD produk dengan pagination, pencarian, sort, validasi, dan soft delete.
- CRUD pelanggan dengan pagination, pencarian, validasi, dan soft delete.
- Pembuatan order multi-item dengan validasi stok atomic.
- Histori dan detail order dengan filter tanggal/customer.
- Dashboard summary dan grafik aktivitas tujuh hari.
- Export histori order ke CSV.
- Migration, seed, automated test, OpenAPI, Docker Compose, dan CI.

### Out of scope

- Pembayaran online.
- Multi-tenant atau multi-cabang.
- Role selain admin.
- Integrasi marketplace atau pengiriman.
- Frontend E2E production-scale.

## 5. Aturan bisnis utama

1. Semua endpoint bisnis membutuhkan access token.
2. Product code harus unik.
3. Harga harus lebih besar dari nol dan stok tidak boleh negatif.
4. Satu order harus memiliki minimal satu item.
5. Produk yang sama tidak boleh muncul dua kali dalam satu order.
6. Stok semua item harus divalidasi sebelum perubahan data dilakukan.
7. Jika satu item gagal, seluruh transaksi dibatalkan.
8. Harga dan total dihitung server, bukan diterima dari client.
9. `order_items.unit_price` menyimpan harga saat transaksi.
10. Penghapusan produk dan pelanggan menggunakan soft delete agar histori tetap terbaca.

## 6. Alur utama

```text
Login
  -> access token disimpan frontend
  -> halaman protected memanggil API
  -> AuthGuard memverifikasi token
  -> controller memvalidasi request
  -> service menjalankan aturan bisnis
  -> Prisma menjalankan query/transaction
  -> response standar dikirim ke frontend
```

### Alur membuat order

```text
Pilih customer dan item
  -> frontend mengirim customer_id + product_id + quantity
  -> DTO memvalidasi bentuk input
  -> service mengambil customer dan produk aktif
  -> validasi duplikasi dan stok
  -> hitung subtotal/total dari harga database
  -> transaction membuat order dan order_items
  -> transaction mengurangi stok
  -> response order dikembalikan
```

## 7. Arsitektur teknis

- Frontend: React 19 + Next.js App Router + TypeScript.
- Backend: Node.js 24+ + NestJS + TypeScript strict.
- ORM: Prisma.
- Database: PostgreSQL.
- Authentication: JWT access token dan refresh token.
- Testing: Jest, Supertest, dan Playwright E2E.
- Delivery: Docker Compose dan GitHub Actions.

Frontend dan backend adalah dua service terpisah. Next.js tidak menjadi backend utama dan seluruh aturan order berada di NestJS.

## 8. Kriteria penerimaan

- Admin dapat login dengan akun hasil seed.
- User tanpa token diarahkan ke login dan API mengembalikan 401.
- Produk dan pelanggan dapat dibuat, diubah, dicari, dipaginasi, dan di-soft-delete.
- Order sukses menyimpan item, total, snapshot harga, dan mengurangi stok.
- Order dengan stok kurang tidak membuat data order dan tidak mengubah stok.
- Dashboard menampilkan summary dan tren tujuh hari.
- CSV mengikuti filter histori yang sedang aktif.
- Migration dapat dijalankan pada database kosong.
- Unit test, integration test, E2E test, lint, dan build dapat dijalankan.

## 9. Risiko dan tindak lanjut

- Token saat ini disimpan di `localStorage` untuk kebutuhan technical test; production sebaiknya memakai httpOnly secure cookie.
- Refresh token rotation dan revoke per-device belum menjadi scope utama.
- E2E test memakai server lokal dan data seed, bukan environment staging.
- Laporan lanjutan dan export Excel native dapat ditambahkan setelah CSV stabil.
