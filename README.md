# Telegram Bot Service (Express)

Satu file: `src/index.ts`. Endpoint untuk kirim pesan, loop untuk terima pesan.

Buat `.env` berisi token dari @BotFather:

    TELEGRAM_BOT_TOKEN=123456:ABC...

Lalu:

    npm install
    npm start

Token dibaca dari `.env` (tsx memuatnya otomatis). `API_BASE` dan `PORT` punya
default di kode; kalau perlu diubah, ubah `process.env.API_BASE` / `PORT` di
`.env` atau langsung di baris atas `src/index.ts`.

## Kirim pesan

    curl -X POST http://localhost:3000/send \
      -H 'content-type: application/json' \
      -d '{"chat_id": 123456789, "text": "halo"}'

Dengan tombol (`buttons`: array baris, satu baris satu array):

    curl -X POST http://localhost:3000/send \
      -H 'content-type: application/json' \
      -d '{"chat_id": 123456789, "text": "Pilih menu",
           "buttons": [
             [{"text": "Ya", "callback_data": "yes"}, {"text": "Tidak", "callback_data": "no"}],
             [{"text": "Buka web", "url": "https://example.com"}]
           ]}'

Tiap tombol isi `callback_data` (dikirim balik ke bot) atau `url`.
`chat_id` bisa angka atau `@username`. Respons adalah body asli Telegram
(`{"ok":true,"result":{...}}`); kalau Telegram menolak, status dan pesannya
diteruskan apa adanya.

## Terima pesan

Loop `getUpdates` menarik update masuk, membalas pantul (`kamu bilang: ...`)
dengan satu tombol OK, lalu menjawab setiap penekanan tombol lewat
`answerCallbackQuery` (tanpa ini spinner di HP nyangkut).

Kalau bot baru dibuat, kirim dulu pesan apa saja ke bot di Telegram supaya bot
boleh membalas; chat ID-nya muncul di log.

Catatan: loop ini long polling. Kalau bot di-set webhook, Telegram menolak
`getUpdates`, jadi pilih salah satu.

`.env` sudah masuk `.gitignore`, jadi token tidak ikut ter-commit.

## MongoDB (Docker)

Database lokal jalan lewat `docker-compose.yml` (image `mongo:7`, data disimpan
di volume `mongodb_data`).

    npm run db:up      # nyalakan, tunggu sampai healthy
    npm run db:down    # matikan (data tetap ada)

Variabel yang dipakai (lihat `.env.example`):

    MONGO_PORT=27017
    MONGO_ROOT_USERNAME=admin
    MONGO_ROOT_PASSWORD=admin123
    MONGO_DATABASE=telegram_bot

Koneksi dibentuk di `src/mongodb/service.ts` dari variabel di atas, atau timpa
langsung dengan `MONGODB_URI` (mis. `mongodb+srv://...` milik Atlas). `npm start`
memanggil `mongoDB.connect()` dulu; kalau database tidak bisa dihubungi, proses
berhenti dengan error, bukan diam-diam jalan tanpa DB.

Cek isi database dari terminal:

    docker exec -it telegram-bot-mongodb mongosh -u admin -p admin123 \
      --authenticationDatabase admin telegram_bot --eval 'db.getCollectionNames()'

