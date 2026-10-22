# OrderHub — keputusan UI dan UX

## Tujuan

Admin dapat menemukan produk, mengelola pelanggan, membuat pesanan, dan memeriksa stok tanpa kehilangan konteks. Biru menandai aksi utama; merah/kuning/hijau menyampaikan status bisnis.

## Referensi

- [shadcn/ui blocks](https://ui.shadcn.com/blocks): susunan sidebar dan login. Implementasi mempertahankan komponen lokal berbasis Radix dan CSS existing.
- [Carbon data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines): toolbar pencarian/filter dekat tabel, aksi baris dan pagination konsisten.
- [NN/g: modal dan nonmodal](https://www.nngroup.com/articles/modal-nonmodal-dialog/): interupsi selektif. Hapus memakai konfirmasi singkat; edit/detail memakai panel samping dengan fokus terkelola Radix.
- [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/): error membantu pemulihan. Login gagal mempertahankan input; error daftar menyediakan coba lagi; error item pesanan tetap di dekat item.

## Implementasi

| Area | Perubahan dan alasan |
| --- | --- |
| Login | Autofill, tampilkan password berlabel, email kosong, error tidak hilang akibat redirect. |
| Navigasi | Akun dari API, buat pesanan, breadcrumb, skip link, menu mobile berlabel. |
| Dashboard | Grafik berlabel dengan tooltip hover/fokus, link stok ke produk, link transaksi ke detail spesifik. |
| Produk/pelanggan | Teks dan target aksi diperbesar, skeleton, retry, reset filter, notifikasi simpan/hapus. |
| Form | Panel samping menjaga konteks; tombol sticky; klik backdrop tidak membuang form. Tombol Batal/Tutup masih dapat membuang perubahan yang belum disimpan. |
| Hapus | Popup ringkas menjelaskan soft delete. Data tidak berubah sebelum konfirmasi. |
| Pesanan | Shortcut buat pesanan; validasi item dan alasan form belum siap ditampilkan. |
| Motion | GSAP dashboard/panel menghormati reduced motion. |
| Logout | API revoke dipanggil sebelum menghapus token lokal; error jaringan dapat dicoba ulang. |

## Verifikasi dan batasan

Playwright menguji login gagal, pembatalan hapus, navigasi/form mobile, dan detail pesanan. API dimock sehingga tidak mengubah database. Screenshot desktop/mobile diperiksa; ini belum studi usability pengguna nyata atau audit aksesibilitas penuh.

Tabel panjang digeser horizontal di layar kecil. Data produksi tidak diganti fixture. Form memakai select native dan HTML validation; pencarian katalog di atas 100 opsi memerlukan pekerjaan lanjutan.

E2E memakai port 3100 dan `.next-e2e` agar tidak menimpa build development. Frontend Docker tetap port 3000.
