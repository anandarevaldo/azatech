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
node -r dotenv/config -r ts-node/register prisma/seed.ts
cd ../frontend && npm install && cp .env.example .env.local
```

Migration dijalankan dengan `npx prisma migrate deploy`, lalu seed dengan `node -r dotenv/config -r ts-node/register prisma/seed.ts`. Seed membuat minimal 20 produk, 15 customer, dan 30 order historis, ditambah data tren demo untuk dashboard. Untuk development, backend berjalan di port 3001 dan frontend di port 3000.

Akun seed lokal:

- Email: `admin@azatech.id`
- Password: nilai `SEED_ADMIN_PASSWORD` pada `.env` lokal.

## Menjalankan aplikasi

```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

## Menjalankan dengan Docker Compose

Docker Compose menyediakan PostgreSQL, backend, dan frontend. Salin `.env.example` ke `.env` di root jika ingin mengganti secret default, lalu jalankan:

```bash
docker compose up --build -d
docker compose run --rm backend node -r dotenv/config -r ts-node/register prisma/seed.ts
```

Aplikasi tersedia di `http://localhost:3000`, API di `http://localhost:3001/api`, dan PostgreSQL Docker di port host `55432` (container tetap `5432`). Data PostgreSQL disimpan pada volume `azatech-postgres-data`. Jika port tersebut sedang dipakai, override dengan `POSTGRES_HOST_PORT`, `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, dan `NEXT_PUBLIC_API_URL`.

## Logika order

Order dibuat dalam satu database transaction. Server mengambil harga terbaru dari tabel produk, memvalidasi seluruh item dan stok, menghitung subtotal/total, membuat snapshot `unit_price`, lalu mengurangi stok. Jika salah satu validasi gagal, transaction dibatalkan sehingga tidak ada stok yang berubah. Produk dan customer menggunakan soft delete agar histori order tetap dapat dibaca.

## Testing

```bash
cd backend
npm test -- --runInBand
npm run build
npm run test:integration
```

Test unit dan controller mencakup login, validasi input, akses tanpa token, order sukses, stok tidak cukup, dan produk duplikat. Integration test PostgreSQL dapat dijalankan dengan `npm run test:integration`; test ini membuat fixture terisolasi, memanggil REST API, memverifikasi transaction serta snapshot harga, lalu membersihkan fixture.

GitHub Actions menjalankan migration, unit/controller test, integration test PostgreSQL, backend build, dan frontend build pada setiap push atau pull request ke `main`.

## Asumsi dan keterbatasan

- Frontend menyimpan token di `localStorage` untuk scope technical test; produksi sebaiknya menggunakan httpOnly secure cookie.
- Pagination sudah tersedia di API; beberapa tabel frontend masih menggunakan kontrol sederhana.
- Seed membuat 1 admin, 20 produk, 15 customer, dan minimal 30 order dalam 30 hari terakhir.
- Frontend melakukan refresh access token sebelum mengarahkan user ke login.
- Riwayat order dapat diekspor ke CSV dengan filter yang sedang aktif.
- Jika ada waktu tambahan: refresh-token rotation, OpenAPI UI, dan E2E Playwright.

## AI Usage

AI assistant digunakan untuk membantu menyusun struktur NestJS/Next.js, DTO dan validasi, skema Prisma, test case, serta dokumentasi. Seluruh kode ditinjau, dijalankan, dan disesuaikan secara manual terhadap requirement technical test.
