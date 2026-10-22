# Frontend

Aplikasi admin berbasis Next.js App Router, React 19, dan TypeScript.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Frontend berkomunikasi dengan backend melalui `NEXT_PUBLIC_API_URL` dan menyediakan login, refresh access token, dashboard, CRUD produk/customer, pembuatan order, filter histori berdasarkan tanggal/customer, dan detail order.

Form produk dan pelanggan memiliki tombol `+` untuk menambahkan foto melalui File Explorer atau URL. Foto lokal dikompresi di browser dan ditampilkan sebagai preview sebelum disimpan. Drawer form menutup saat area luar ditekan; form pesanan yang sudah terisi akan meminta konfirmasi untuk menyimpan draft.
