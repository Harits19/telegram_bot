import { Button, MessageOutbound } from "./type.js";

class TelegramService {
  async telegram(method: string, payload: Record<string, unknown>) {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
    const baseURL = "https://api.telegram.org";

    const response = await fetch(`${baseURL}/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { status: response.status, body: (await response.json()) as any };
  }

  sendMessage({
    chatId,
    text,
    reply_markup,
  }: MessageOutbound & {
    chatId: string;
  }) {
    return this.telegram("sendMessage", {
      chat_id: chatId,
      text,
      reply_markup,
    });
  }

  async answerCallbackQuery({
    callback_query_id,
  }: {
    callback_query_id: string;
  }) {
    await this.telegram("answerCallbackQuery", {
      callback_query_id,
    });
  }
}

export const telegramService = new TelegramService();
