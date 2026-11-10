# Aturan kerja agent di repo ini

Berlaku untuk semua agent, subagent, dan sesi yang bekerja di folder ini.

## Bahasa komentar kode: Inggris

- Semua komentar kode ditulis dalam bahasa Inggris: `//`, `/* */`, JSDoc, komentar YAML dan `.env`, Dockerfile, dan shell. Termasuk komentar TODO dan label satu kata.
- Boleh menulis komentar Inggris walau percakapan, commit message, atau instruksi user berbahasa Indonesia.
- README dan dokumen prosa tetap bahasa Indonesia.
- String runtime bukan komentar: pesan log, pesan error, dan teks balasan bot mengikuti bahasa yang sudah dipakai project (Indonesia).
- Kalau mengedit file yang komentarnya masih Indonesia, terjemahkan seluruh komentar di file itu, jangan separuh.
- Cek sebelum selesai: komentar yang baru ditulis harus Inggris.

## Konvensi kode

- Komentar menjelaskan alasan dan perilaku yang tidak kelihatan dari kode, bukan mengulang baris di bawahnya. Satu komentar per blok logika, satu sampai dua baris.
- Default konfigurasi ada di kode (`process.env.X ?? "default"`), rahasia hanya di `.env`. `.env` tidak pernah dibaca atau dicetak isinya.
- Sebelum menganggap selesai: `npm run typecheck` bersih, dan perubahan yang menyentuh database diuji ke MongoDB sungguhan (`npm run db:up`, lalu query lewat `docker exec ... mongosh`).

## Antislop

Skill `antislop` (core) plus sub-skill yang cocok wajib dibaca sebelum kerja UI, layout, copy, atau komentar kode. Mode `during`: aturan dipakai sambil menulis. Umumkan sekali per sesi: `antislop active: during (global preference).`
