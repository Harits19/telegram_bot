# Telegram Bot Service (Express)

Service kecil: satu endpoint untuk kirim pesan, satu loop untuk terima pesan.

    npm install
    cp .env.example .env     # isi TELEGRAM_BOT_TOKEN dari @BotFather
    npm run dev

## Kirim pesan

    curl -X POST http://localhost:3000/send \
      -H 'content-type: application/json' \
      -d '{"chat_id": 123456789, "text": "halo"}'

`chat_id` bisa angka atau `@username`. Responsnya body asli dari Telegram
(`{"ok":true,"result":{...}}`), jadi kalau Telegram menolak, status dan pesannya
diteruskan apa adanya.

## Terima pesan

Loop `getUpdates` di `src/index.ts` menarik pesan masuk dan membalas pantul
(`kamu bilang: ...`). Kalau bot baru dibuat, kirim dulu pesan apa saja ke bot di
Telegram supaya bot boleh membalas, lalu chat ID-nya muncul di log.

Catatan: loop ini pakai long polling. Kalau nanti bot di-set webhook, Telegram
menolak `getUpdates`, jadi pilih salah satu.
