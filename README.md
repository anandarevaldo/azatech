# Azatech Online Shop

Implementasi technical test Medior Fullstack Developer - Track A.

## Stack

- Backend: Node.js 24+, NestJS, TypeScript strict, Prisma 7, PostgreSQL.
- Auth: JWT access token dan refresh token; password di-hash dengan bcrypt.
- Frontend: React 19, Next.js App Router, TypeScript, CSS responsive.
- Testing: Jest, Supertest, dan unit/integration-style service tests.

### Alasan pemilihan stack

- NestJS dipilih karena struktur module/controller/service membantu memisahkan HTTP layer, business logic, dan dependency database.
- TypeScript strict dipakai agar kontrak DTO, service, dan response lebih aman saat aplikasi berkembang.
- Prisma dipilih karena type-safe, memiliki migration dan seed yang eksplisit, serta nyaman dipakai bersama PostgreSQL.
- PostgreSQL dipilih karena relasi, foreign key, constraint, dan database transaction penting untuk proses order yang atomic.
- Next.js App Router dipakai untuk membangun admin workspace React yang terstruktur, responsive, dan mudah dipisahkan dari backend REST API.
- Jest dan Supertest dipakai untuk menguji business rule serta endpoint dengan database PostgreSQL nyata.

## Struktur

```text
backend/   REST API, migration, seed, business logic, tests
frontend/  Next.js admin application
```

## Mulai cepat dengan Docker

Prasyarat: Docker Compose. Dari database kosong sampai aplikasi berjalan:

```bash
git clone https://github.com/anandarevaldo/azatech.git
cd azatech
cp .env.example .env
docker compose up --build -d
docker compose run --rm backend npm run seed
```

Sebelum menjalankan Compose, isi `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, dan `SEED_ADMIN_PASSWORD` di `.env` root dengan nilai lokal Anda. Login memakai `admin@azatech.id` dan password `SEED_ADMIN_PASSWORD` tersebut. Frontend: `http://localhost:3000`; API: `http://localhost:3001/api`; dokumentasi interaktif: `http://localhost:3001/api/docs`. Database Docker disimpan pada volume `azatech-postgres-data` dan diekspos di port host `55432`. Jika port bentrok, ubah `POSTGRES_HOST_PORT`, `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT`, dan `NEXT_PUBLIC_API_URL`.

## Setup lokal tanpa Docker

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

## Logika order

Order dibuat dalam satu database transaction. Server mengambil harga terbaru dari tabel produk, memvalidasi seluruh item dan stok, menghitung subtotal/total, membuat snapshot `unit_price`, lalu mengurangi stok dengan syarat stok masih mencukupi. Jika satu item gagal atau stok berubah saat transaksi berlangsung, transaction dibatalkan sehingga tidak ada stok yang berubah. Produk dan customer menggunakan soft delete agar histori order tetap dapat dibaca. Kolom `imageUrl` ditambahkan pada produk dan pelanggan untuk foto opsional; index nama, tanggal order, relasi customer, dan soft delete mempercepat pencarian serta riwayat.

## Testing dan quality gate

```bash
# Dari root repository
npm run lint
npm run test
npm run build

# Backend dengan PostgreSQL nyata
cd backend
npm test -- --runInBand
npm run build
npm run test:integration
```

Frontend E2E menggunakan Playwright dan otomatis menyalakan Next.js development server:

```bash
cd frontend
npx playwright install chromium   # sekali di mesin baru
npm run test:e2e
```

Test unit dan controller mencakup login, validasi input, akses tanpa token, order sukses, stok tidak cukup, dan produk duplikat. Lima integration test PostgreSQL dapat dijalankan dengan `npm run test:integration`; test ini membuat fixture terisolasi, memanggil REST API, memverifikasi transaction serta snapshot harga, lalu membersihkan fixture. Playwright mencakup form login, error login, konfirmasi hapus produk, navigasi mobile, serta dashboard dan detail order.

GitHub Actions menjalankan lint, migration, unit/controller test, integration test PostgreSQL, backend build, frontend build, dan frontend smoke E2E pada setiap push atau pull request ke `main`.

## Asumsi dan keterbatasan

- Frontend menyimpan token di `localStorage` untuk scope technical test; produksi sebaiknya menggunakan httpOnly secure cookie.
- Pagination sudah tersedia di API; beberapa tabel frontend masih menggunakan kontrol sederhana.
- Seed membuat 1 admin, 20 produk, 15 customer, dan minimal 30 order dalam 30 hari terakhir.
- Frontend melakukan refresh access token sebelum mengarahkan user ke login.
- Riwayat order dapat diekspor ke CSV dengan filter yang sedang aktif.
- E2E pembuatan transaksi penuh dengan backend nyata belum tersedia; saat ini alur dashboard dan detail order diuji dengan respons API terkontrol.

## AI Usage

OpenAI Codex digunakan untuk membantu menyusun struktur NestJS/Next.js, DTO dan validasi, skema Prisma, test case, serta dokumentasi. Hasilnya diperiksa melalui lint, build, automated test, dan peninjauan tampilan.
