# Editor Flow Config

Frontend untuk mengubah flow bot Telegram. Satu halaman: daftar flow di kiri,
editor di kanan. Data diambil dan disimpan lewat `/api/flows` di proses bot, jadi
tidak ada penyimpanan lokal di browser.

Jalankan backend dulu (`npm run db:up && npm start` dari root repo), lalu:

    npm run dev      # http://localhost:5173, proxy /api ke localhost:3000
    npm run build    # hasil ke web/dist, ikut dilayani bot di :3000
    npm run lint

Catatan perilaku:

- `id` flow dibuat backend (ObjectId). Flow baru dikirim lewat `POST`, flow yang
  sudah ada lewat `PUT /api/flows/:id`.
- Trigger harus sama persis dengan pesan masuk, huruf kecil.
- Tombol inline dengan `callback_data` harus menunjuk ID step yang ada; bot
  memakai nilai itu sebagai step tujuan.
- Simpan diblokir selama validasi masih punya error; daftar error tampil di atas
  editor.
