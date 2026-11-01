# Kuis TPA: 7 Jurus Terlarang

Kuis 35 soal dengan login nama bebas, progres tersimpan per nama, umpan balik langsung benar/salah, timer per soal (no 1-5: 30 detik, no 6-30: 3,5 menit, no 31-35: 1 menit), dan mode guru (login dengan nama `Ferdi`) untuk pembahasan, mulai baru, jeda, dan matikan sesi.

Teknologi: Cloudflare Workers (static assets) + satu Durable Object untuk status sesi dan progres. Tidak butuh database terpisah.

## Deploy lewat GitHub

1. Buat repo GitHub, lalu push isi folder ini (`git init`, `git add .`, `git commit`, `git push`).
2. Di dashboard Cloudflare: **Workers & Pages > Create > Import a repository**, pilih repo tersebut.
3. Biarkan build command kosong dan deploy command `npx wrangler deploy`. Klik Deploy.
4. Buka **Settings > Variables and Secrets**, tambahkan `GURU_PIN` (disarankan) berisi PIN guru, lalu deploy ulang.
5. Alamat `https://kuis-tpa.<akun>.workers.dev` bisa dibagikan ke siswa. Domain sendiri bisa dipasang di **Settings > Domains & Routes**.

Jika `GURU_PIN` kosong, siapa pun yang mengetik nama `Ferdi` bisa mengontrol kelas. Dengan PIN, kontrol dan pembahasan hanya terbuka untuk yang memasukkan PIN.

## Uji lokal

```
npm install
npx wrangler dev
```

## Cara pakai

- Guru: masuk dengan nama `Ferdi` (plus PIN). **Mulai baru** membuka sesi baru dan mengosongkan progres siswa. **Jeda** menghentikan timer semua siswa. **Matikan** mengunci halaman siswa, **Aktifkan kembali** melanjutkan sesi yang sama.
- Siswa: masuk dengan nama bebas. Masuk lagi dengan nama yang sama untuk melanjutkan.

## Catatan

- Halaman siswa mengecek status sesi tiap 3 detik, jadi jeda atau matikan terasa dalam beberapa detik. Paket gratis Cloudflare membatasi 100.000 request Worker per hari.
- Kunci jawaban ada di sisi klien (perlu untuk umpan balik instan), cukup untuk latihan kelas, bukan ujian berisiko tinggi. Pembahasan hanya dikirim server ke guru.
- Nama siswa dipakai sebagai kunci progres, jadi dua siswa dengan nama sama akan berbagi progres.
- Soal 31-35 berupa gambar di `public/img`. Lingkaran penanda jawaban pada gambar asli sudah dihapus.
