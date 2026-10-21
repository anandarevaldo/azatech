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

Migration dijalankan dengan `npx prisma migrate deploy`. Seed dijalankan dengan `node -r dotenv/config -r ts-node/register prisma/seed.ts` setelah `SEED_ADMIN_PASSWORD` tersedia di `.env`; password admin disimpan sebagai bcrypt hash.

`npm run test:integration` menjalankan test REST API terhadap PostgreSQL pada `DATABASE_URL`, lalu membersihkan data fixture secara otomatis.
