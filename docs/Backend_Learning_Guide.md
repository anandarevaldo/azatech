# Panduan Belajar Backend OrderHub

Panduan ini membantu memahami backend dari lokasi file, tanggung jawab tiap folder, alur request, dan cara memodifikasi fitur tanpa merusak aturan bisnis.

## 1. Cara membaca backend

Mulai dari tiga file berikut:

1. `backend/src/main.ts` — titik masuk aplikasi HTTP.
2. `backend/src/app.module.ts` — daftar module yang dipasang.
3. `backend/prisma/schema.prisma` — bentuk data dan relasi database.

Setelah itu baca satu fitur secara vertikal, misalnya order:

```text
orders.controller.ts
  -> dto/*.ts
  -> orders.service.ts
  -> prisma/schema.prisma
  -> orders.integration.spec.ts
```

## 2. Struktur folder backend

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── auth/
│   ├── common/
│   ├── database/
│   ├── products/
│   ├── customers/
│   ├── orders/
│   └── dashboard/
└── package.json
```

### `src/main.ts`

Tempat aplikasi Nest dibuat dan dikonfigurasi:

- global prefix `/api`;
- CORS;
- `ValidationPipe`;
- exception filter;
- port HTTP.

### `src/app.module.ts`

Root module. File ini menggabungkan `AuthModule`, `ProductsModule`, `CustomersModule`, `OrdersModule`, `DashboardModule`, dan `DatabaseModule`.

### `src/auth/`

Berisi login dan keamanan:

- `auth.controller.ts`: endpoint login, refresh, logout, dan profile.
- `auth.service.ts`: verifikasi user, hash password, pembuatan token.
- `auth.guard.ts`: mengambil bearer token dan memverifikasinya.
- `token.util.ts`: sign/verify JWT.
- `password.util.ts`: hash dan verifikasi password.
- `dto/login.dto.ts`: validasi input login.

### `src/common/`

Kode lintas fitur:

- `api-response.ts`: response sukses konsisten dan serialisasi `BigInt`/`Decimal`.
- `http-exception.filter.ts`: mengubah exception menjadi format error API.

### `src/database/`

`prisma.service.ts` membuat satu Prisma client yang dipakai module lain. Jangan membuat Prisma client baru di setiap service.

### `src/products/` dan `src/customers/`

Setiap fitur biasanya memiliki:

- `*.module.ts`: dependency injection boundary.
- `*.controller.ts`: route HTTP.
- `*.service.ts`: query database dan aturan fitur.
- `dto/`: bentuk input dan validasi.

### `src/orders/`

Fitur paling penting secara bisnis. `orders.service.ts` mengatur validasi customer, produk, stok, total, order number, database transaction, detail order, dan CSV export.

### `src/dashboard/`

Mengambil aggregate transaksi, produk terlaris, stok rendah, dan tren tujuh hari untuk endpoint summary.

### `prisma/schema.prisma`

Sumber model database. Di sini terlihat tipe field, primary key, unique constraint, foreign key, index, soft delete, dan relasi.

### `prisma/migrations/`

Riwayat perubahan database. Migration harus dapat dijalankan dari database kosong dan tidak boleh diedit sembarangan setelah dipakai bersama.

### `prisma/seed.ts`

Data awal admin, produk, pelanggan, dan order historis. Seed harus idempotent atau setidaknya aman dijalankan ulang pada database development.

## 3. Flow request backend

Contoh `POST /api/orders`:

```text
HTTP request
  -> Nest router menemukan OrdersController
  -> AuthGuard memeriksa access token
  -> ValidationPipe mengubah dan memvalidasi DTO
  -> OrdersController meneruskan DTO ke OrdersService
  -> OrdersService memakai Prisma transaction
  -> HttpExceptionFilter menangani error jika ada
  -> api-response mengembalikan JSON standar
```

Response sukses memiliki bentuk:

```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "data": {}
}
```

Error validasi atau business rule memiliki bentuk:

```json
{
  "success": false,
  "message": "Stok tidak mencukupi",
  "errors": {
    "items.0.quantity": ["Stok tidak cukup"]
  }
}
```

## 4. Cara membaca potongan kode

Saat membaca function, tanyakan lima hal:

1. Input-nya dari mana: body, query, param, token, atau database?
2. Validasi apa yang dilakukan?
3. Data apa yang dibaca atau diubah?
4. Apakah operasi harus atomic?
5. Output dan error-nya seperti apa?

Contoh pola service:

```ts
async findOne(id: bigint) {
  const product = await this.prisma.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!product) {
    throw new NotFoundException('Produk tidak ditemukan');
  }

  return successResponse('OK', serializeValue(product));
}
```

Cara membacanya:

- `async` berarti function menunggu operasi database.
- `id` adalah input dari controller.
- `findFirst` mencari produk aktif.
- `deletedAt: null` menerapkan soft delete.
- `NotFoundException` menghasilkan HTTP 404.
- `successResponse` membuat format response konsisten.

## 5. Cara memodifikasi fitur

Gunakan urutan berikut:

1. Tulis perubahan yang diinginkan dalam satu kalimat.
2. Cari endpoint atau halaman yang terdampak dengan `rg`.
3. Baca controller, DTO, service, schema, dan test terkait.
4. Tentukan apakah perubahan hanya UI, API, business logic, atau database.
5. Ubah DTO terlebih dahulu jika bentuk input berubah.
6. Ubah service untuk aturan bisnis.
7. Ubah controller hanya untuk routing atau status HTTP.
8. Tambahkan atau ubah test untuk behavior baru.
9. Update OpenAPI dan README bila kontrak publik berubah.
10. Jalankan test, build, dan smoke test.

Contoh tugas: menambahkan filter stok rendah.

```text
ListProductsDto      -> tambahkan stock_status yang valid
ProductsService      -> tambahkan kondisi where stock
ProductsController   -> biasanya tidak perlu diubah
Frontend products    -> kirim query stock_status
OpenAPI              -> dokumentasikan parameter baru
Test                 -> pastikan produk stock 0/1/5 masuk kategori yang benar
```

## 6. Contoh salah folder dan alasannya

### Salah: query database di controller

```ts
@Get()
list() {
  return this.prisma.product.findMany();
}
```

Masalahnya controller menjadi tahu detail database dan sulit dites. Query seharusnya berada di `products.service.ts`.

### Salah: menaruh aturan stok di frontend

```ts
if (quantity <= product.stock) {
  submitOrder();
}
```

Ini berguna sebagai feedback UI, tetapi bukan keamanan bisnis. Server tetap harus memvalidasi stok karena data dapat berubah atau request dapat dimanipulasi.

### Salah: menaruh file order di `products/`

`orders` memiliki transaction dan aturan bisnis sendiri. File order harus berada di `backend/src/orders/`, bukan di module produk.

### Salah: mengedit migration lama

Jika migration sudah pernah dijalankan, buat migration baru. Mengedit migration lama dapat membuat database developer, CI, dan production memiliki struktur berbeda.

### Salah: membuat Prisma client di setiap request

Gunakan `PrismaService` dari `database` module. Membuat client berulang dapat menghabiskan koneksi database.

## 7. Checklist sebelum mengirim perubahan

- Apakah endpoint tetap membutuhkan auth?
- Apakah input divalidasi di DTO?
- Apakah query menghormati soft delete?
- Apakah harga/total dihitung server?
- Apakah operasi multi-tabel memakai transaction?
- Apakah error memiliki status HTTP dan message yang tepat?
- Apakah test mencakup sukses dan gagal?
- Apakah OpenAPI, README, dan `.env.example` perlu diperbarui?
- Apakah `npm test`, integration test, build, dan Docker smoke test lolos?

## 8. Perintah kerja harian

```bash
# Backend
cd backend
npm run start:dev
npm test -- --runInBand
npm run test:integration
npm run build

# Frontend
cd ../frontend
npm run dev
npm run build
```

Gunakan `rg -n "kata-kunci" backend/src frontend/src` untuk menemukan function, endpoint, atau komponen yang perlu dipahami sebelum mengubah kode.
