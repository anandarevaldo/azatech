# Azatech Online Shop

Implementasi technical test Medior Fullstack Developer - Track A.

## Stack

- Backend: Node.js 24+, NestJS, TypeScript strict, Prisma 7, PostgreSQL.
- Auth: JWT access token dan refresh token; password di-hash dengan bcrypt.
- Frontend: React 19, Next.js App Router, TypeScript, CSS responsive.
- Testing: Jest, Supertest, dan unit/integration-style service tests.

## Struktur

```text
backend/   REST API, migration, seed, business logic, tests
frontend/  Next.js admin application
docs/      technical test dan API documentation
```

## Setup lokal

Prasyarat: Node.js 24+, PostgreSQL 14+ dan database `azatech`.

```bash
git clone https://github.com/anandarevaldo/azatech.git
cd azatech/backend && npm install
cp .env.example .env
npx prisma migrate deploy
npx ts-node prisma/seed.ts
cd ../frontend && npm install && cp .env.example .env.local
```

Migration dijalankan dengan `npx prisma migrate deploy`, lalu seed dengan `npx ts-node prisma/seed.ts`. Seed membuat minimal 20 produk, 15 customer, dan 30 order historis, ditambah data tren demo untuk dashboard. Untuk development, backend berjalan di port 3001 dan frontend di port 3000.

Akun seed lokal:

- Email: `admin@azatech.id`
- Password: nilai `SEED_ADMIN_PASSWORD` pada `.env` lokal.

## Menjalankan aplikasi

```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

## Logika order

Order dibuat dalam satu database transaction. Server mengambil harga terbaru dari tabel produk, memvalidasi seluruh item dan stok, menghitung subtotal/total, membuat snapshot `unit_price`, lalu mengurangi stok. Jika salah satu validasi gagal, transaction dibatalkan sehingga tidak ada stok yang berubah. Produk dan customer menggunakan soft delete agar histori order tetap dapat dibaca.

## Testing

```bash
cd backend
npm test -- --runInBand
npm run build
```

Test mencakup login, validasi input, akses tanpa token, order sukses, stok tidak cukup, dan produk duplikat.

## Asumsi dan keterbatasan

- Frontend menyimpan token di `localStorage` untuk scope technical test; produksi sebaiknya menggunakan httpOnly secure cookie.
- Pagination sudah tersedia di API; beberapa tabel frontend masih menggunakan kontrol sederhana.
- Seed membuat 1 admin, 20 produk, 15 customer, dan minimal 30 order dalam 30 hari terakhir.
- Frontend melakukan refresh access token sebelum mengarahkan user ke login.
- Jika ada waktu tambahan: refresh-token rotation, OpenAPI UI, E2E Playwright, Docker Compose, dan GitHub Actions.

## AI Usage

AI assistant digunakan untuk membantu menyusun struktur NestJS/Next.js, DTO dan validasi, skema Prisma, test case, serta dokumentasi. Seluruh kode ditinjau, dijalankan, dan disesuaikan secara manual terhadap requirement technical test.
