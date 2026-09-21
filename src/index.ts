import express, { type Request, type Response } from 'express';

// Config default. Ganti langsung di sini kalau perlu.
const TOKEN = '8654559773:AAEFTO-KuwPVRpWyRuoBSouqubNbJ8SDcuk';
const API_BASE = 'https://api.telegram.org';
const PORT = 3000;

/** Tombol: isi `callback_data` (dikirim balik ke bot) atau `url`. */
type Button = { text: string; callback_data?: string; url?: string };

/** Panggil satu method Bot API, kembalikan status dan body JSON-nya. */
async function telegram(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: (await response.json()) as any };
}

/** Baris-baris tombol; satu baris = satu array. */
function sendMessage(chatId: number | string, text: string, buttons?: Button[][]) {
  return telegram('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: buttons === undefined ? undefined : { inline_keyboard: buttons },
  });
}

const app = express();
app.use(express.json());

// Kirim pesan: POST /send { chat_id, text, buttons? }
app.post('/send', async (req: Request, res: Response) => {
  const { chat_id, text, buttons } = req.body ?? {};
  if (chat_id === undefined || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ ok: false, error: 'butuh chat_id dan text' });
  }

  try {
    const { status, body } = await sendMessage(chat_id, text, buttons);
    res.status(status).json(body);
  } catch (error) {
    res.status(502).json({ ok: false, error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`service jalan di http://localhost:${PORT} (POST /send)`);
});

// Terima pesan: tarik update dari Telegram terus-menerus, lalu balas pantul.
let offset = 0;

async function poll(): Promise<void> {
  while (true) {
    try {
      const { body } = await telegram('getUpdates', { offset, timeout: 30 });
      const updates: any[] = body?.result ?? [];

      // Tanpa jeda, jawaban kosong yang cepat membuat loop berputar tanpa henti.
      if (updates.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      for (const update of updates) {
        offset = update.update_id + 1;

        // Tombol ditekan: wajib dijawab, kalau tidak spinner di HP nyangkut.
        const query = update.callback_query;
        if (query !== undefined) {
          console.log(`tombol ditekan di ${query.message?.chat?.id}: ${query.data}`);
          await telegram('answerCallbackQuery', {
            callback_query_id: query.id,
            text: `kamu tekan: ${query.data ?? '-'}`,
          });
          continue;
        }

        const chatId = update.message?.chat?.id;
        const text = update.message?.text;
        if (chatId === undefined || typeof text !== 'string') continue;

        console.log(`pesan masuk dari ${chatId}: ${text}`);
        await sendMessage(chatId, `kamu bilang: ${text}`, [
          [{ text: 'OK', callback_data: 'ok' }],
        ]);
      }
    } catch (error) {
      console.error('gagal ambil update:', (error as Error).message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

void poll();
