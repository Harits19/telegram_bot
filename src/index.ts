import { Logger } from "./config/logger.js";
import { flowService } from "./flow/service.js";
import { telegramService } from "./telegram/service.js";
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

let offset = 0;

async function poll(): Promise<void> {
  const logger = new Logger(poll);

  while (true) {
    try {
      const updates = await telegramService.getUpdates(offset);

      if (updates.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      for (const update of updates) {
        offset = update.update_id + 1;
        flowService.digest(update);
      }
    } catch (error) {
      logger.error("error", error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

void poll();
