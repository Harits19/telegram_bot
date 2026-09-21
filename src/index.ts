import { flowService } from "./flow/service.js";
import { UpdateInbound } from "./telegram/type.js";

// Default di kode; bisa ditimpa dari .env.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API_BASE = process.env.API_BASE ?? "https://api.telegram.org";

if (TOKEN === "") {
  console.warn(
    "TELEGRAM_BOT_TOKEN kosong: isi di .env (lihat contoh di README)",
  );
}

/** Tombol: isi `callback_data` (dikirim balik ke bot) atau `url`. */

/** Panggil satu method Bot API, kembalikan status dan body JSON-nya. */
async function telegram(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: (await response.json()) as any };
}

/** Baris-baris tombol; satu baris = satu array. */

// Terima pesan: tarik update dari Telegram terus-menerus, lalu balas pantul.
let offset = 0;

async function poll(): Promise<void> {
  while (true) {
    try {
      const { body } = await telegram("getUpdates", { offset, timeout: 30 });
      const updates: UpdateInbound[] = body?.result ?? [];

      // Tanpa jeda, jawaban kosong yang cepat membuat loop berputar tanpa henti.
      if (updates.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      for (const update of updates) {
        offset = update.update_id + 1;
        flowService.digest(update);
      }

      // for (const update of updates) {
      //   offset = update.update_id + 1;

      //   // Tombol ditekan: wajib dijawab, kalau tidak spinner di HP nyangkut.
      //   const query = update.callback_query;
      //   if (query !== undefined) {
      //     console.log(
      //       `tombol ditekan di ${query.message?.chat?.id}: ${query.data}`,
      //     );
      //     await telegram("answerCallbackQuery", {
      //       callback_query_id: query.id,
      //       text: `kamu tekan: ${query.data ?? "-"}`,
      //     });
      //     continue;
      //   }

      //   const chatId = update.message?.chat?.id;
      //   const text = update.message?.text;
      //   if (chatId === undefined || typeof text !== "string") continue;

      //   console.log(`pesan masuk dari ${chatId}: ${text}`);
      //   // await sendMessage(chatId, `kamu bilang: ${text}`, [
      //   //   [{ text: 'OK', callback_data: 'ok' }],
      //   // ]);
      // }
    } catch (error) {
      console.error("gagal ambil update:", (error as Error).message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

void poll();
