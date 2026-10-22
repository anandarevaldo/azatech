# Backend

REST API utama Azatech. Semua logika bisnis order berada di service backend, bukan di Next.js.

## Perintah

```bash
npm install
npm run start:dev
npm test -- --runInBand
npm run build
npm run test:integration
```

Migration dijalankan dengan `npx prisma migrate deploy`. Seed dijalankan dengan `npm run seed` setelah `SEED_ADMIN_PASSWORD` tersedia di `.env`; password admin disimpan sebagai bcrypt hash. Di Docker, gunakan `docker compose run --rm backend npm run seed`.

Endpoint produk dan pelanggan menerima `image_url` opsional dengan batas 1 MB. Frontend mengirim foto lokal sebagai data URL setelah kompresi sebelum disimpan.

`npm run test:integration` menjalankan test REST API terhadap PostgreSQL pada `DATABASE_URL`, lalu membersihkan data fixture secara otomatis.
