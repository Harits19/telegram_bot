# Telegram Bot Service

Bot Telegram dengan flow yang diatur dari database, plus editor web untuk
mengubah flow tersebut. Bot dan API jalan di satu proses (`src/index.ts`).

Buat `.env` berisi token dari @BotFather:

    TELEGRAM_BOT_TOKEN=123456:ABC...

Lalu:

    npm install
    npm run db:up     # MongoDB lewat Docker
    npm start         # bot + API di http://localhost:3000

Token dan `MONGODB_URI` dibaca dari `.env` (tsx memuatnya otomatis). `API_BASE`
dan `PORT` punya default di kode (`https://api.telegram.org` dan `3000`); kalau
perlu diubah, isi di `.env`.

## Flow config API

CRUD flow disimpan di koleksi `flow_configs`:

    GET    /api/flows        daftar flow
    GET    /api/flows/:id    satu flow
    POST   /api/flows        buat flow baru   -> 201
    PUT    /api/flows/:id    ganti flow       -> 200
    DELETE /api/flows/:id    hapus flow       -> 204

Body untuk POST/PUT hanya berisi `trigger` dan `steps`. `id` dibuat MongoDB, jadi
tidak dikirim klien; semua respons memakai bentuk yang sama:

    {
      "id": "691254f10f02a28b490289dd",
      "trigger": ["halo", "hi"],
      "steps": [
        {
          "id": "greeting",
          "response": { "text": "Selamat Datang di Multi Purpose Bot!" }
        }
      ]
    }

Validasi menolak `trigger` kosong, `steps` kosong, ID step kosong atau dobel, dan
`response` yang bukan objek. Isi step lainnya (HTTP config, `$expr`, tombol)
diteruskan apa adanya ke bot. Error memakai bahasa Inggris dengan bentuk
`{ "error": "..." }`; 404 dipakai untuk ID yang tidak ada.

Contoh:

    curl -X POST http://localhost:3000/api/flows \
      -H 'content-type: application/json' \
      -d '{"trigger":["promo"],"steps":[{"id":"awal","response":{"text":"Halo!"}}]}'

## Editor web

Editor ada di `web/` (React + Vite). Sumbernya sengaja tipis: satu halaman daftar
di sidebar, satu editor di kanan, dengan pratinjau bubble Telegram per step.

Mode dev (hot reload, proxy `/api` ke `:3000`):

    npm run web:dev     # http://localhost:5173

Mode produksi (dilayani proses bot dari `web/dist`):

    npm run web:build
    npm start           # http://localhost:3000

Isi editor mengikuti bentuk API di atas: trigger berupa chip, step bisa diurutkan,
response bisa text/photo atau `$expr`, keyboard inline/reply, panggilan HTTP sebelum
kirim, dan key context untuk menangkap balasan user. Tombol inline dengan
`callback_data` harus menunjuk ID step yang ada, karena bot memakai nilai itu
sebagai step tujuan; editor menandai tombol yatim sebagai error sebelum disimpan.

## Terima pesan

Loop `getUpdates` menarik update masuk lalu meneruskannya ke `flowService`:

- pesan baru dicocokkan dengan `trigger` flow (harus sama persis, huruf kecil);
  kalau cocok, step pertama dikirim;
- penekanan tombol inline memakai `callback_data` sebagai ID step tujuan;
- balasan user yang me-reply pesan bot memakai `next_step` dari step tersebut;
- setiap step boleh memanggil HTTP dulu, menyimpan hasilnya di `session.context`,
  lalu menyusun pesan lewat `$expr` yang dibaca dari context itu.

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

Saat start pertama, `flowRepository.initFlowConfig()` mengisi satu flow contoh
(`defaultFlowConfig`) kalau koleksi masih kosong.

Cek isi database dari terminal:

    docker exec -it telegram-bot-mongodb mongosh -u admin -p admin123 \
      --authenticationDatabase admin telegram_bot --eval 'db.getCollectionNames()'
