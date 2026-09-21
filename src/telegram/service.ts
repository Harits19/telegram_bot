import { Logger } from "../config/logger.js";
import { FlowConfigStep } from "../flow/type.js";
import {
  Button,
  MessageOutbound,
  SendMessageResponse,
  UpdateInbound,
} from "./type.js";

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

  logger = new Logger(TelegramService);

  async sendMessage({
    chatId,
    ...payloadBase
  }: MessageOutbound & {
    $expr?: string;
    chatId: string;
  }) {
    const payload: Partial<MessageOutbound> = JSON.parse(
      JSON.stringify(payloadBase),
    );

    delete payload.$expr;

    const logger = this.logger.nested(this.sendMessage);

    logger.info(
      `try to send message with payload ${JSON.stringify(payload, null, 2)}`,
    );

    const result = await this.telegram("sendMessage", {
      chat_id: chatId,
      ...payload,
    });

    logger.info(
      `success send message response ${JSON.stringify(result, null, 2)}`,
    );

    return result as SendMessageResponse;
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

  async getUpdates(offset: number) {
    const { body } = await this.telegram("getUpdates", { offset, timeout: 30 });
    const updates: UpdateInbound[] = body?.result ?? [];
    return updates;
  }
}

export const telegramService = new TelegramService();
