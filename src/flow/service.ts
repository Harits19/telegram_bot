import { Logger, logger } from "../config/logger.js";
import { telegramService } from "../telegram/service.js";
import { UpdateInbound } from "../telegram/type.js";
import {
  FlowConfig,
  FlowConfigStep,
  FlowSession,
  OutboundConversation,
} from "./type.js";
const sessions: Record<string, FlowSession> = {};
const configs: FlowConfig[] = [
  {
    id: "id-123",
    trigger: ["halo", "hi"],
    steps: [
      {
        id: "greeting",
        text: "Selamat Datang di 1 Engage Multi Purpose Bot!",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Menu Utama", callback_data: "ask_wants" }],
          ],
        },
      },

      {
        id: "ask_wants",
        text: "Sedang mencari apa?",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Info Cuaca", callback_data: "info_cuaca" },
              {
                text: "Info Jadwal Sholat",
                callback_data: "request_location",
              },
            ],
          ],
        },
      },

      {
        id: "info_cuaca",
        text: "Info cuaca di jakarta",
      },

      {
        id: "request_location",
        context: "request_location",
        text: "Untuk request cuaca, mohon berikan lokasi anda",
        reply_markup: {
          keyboard: [
            [
              {
                text: "Kirim Lokasi",
                request_location: true,
              },
            ],
          ],
        },
      },

      {
        id: "info_jadwal_sholat",
        http: {
          context: "info_jadwal_sholat",
          config: {
            method: "GET",
            url: "https://api.banghasan.com/sholat/format/json/kota/cari/jakarta",
          },
        },
        text: "Info jadwal sholat di jakarta",
      },
    ],
  },
];

class FlowService {
  logger = new Logger(FlowService);

  getChatId(update: UpdateInbound) {
    const id =
      update.message?.chat?.id || update.callback_query?.message?.chat.id;

    return id?.toString();
  }
  digest(update: UpdateInbound) {
    const logger = this.logger.nested(this.digest);
    const identifier = this.getChatId(update);

    logger.debug(`update ${JSON.stringify(update, null, 2)}`);

    if (!identifier) {
      logger.warn(`Empty chat id`);
      return;
    }
    const session = sessions[identifier];
    logger.info(`${identifier} isHaveSession : ${!!session}`);

    if (session) {
      this.handleCurrentSession(update, session);
    } else {
      this.handleNewSession(update);
    }
  }

  async saveToContext({
    session,
    update,
  }: {
    update: UpdateInbound;
    session: FlowSession;
  }) {
    const messageId = update.message?.reply_to_message?.message_id;

    if (messageId) {
      const conversation = session.conversation.find(
        (item) =>
          item.type === "outbound" && item.payload.message_id === messageId,
      );

      if (conversation) {
        const context = (conversation.payload as OutboundConversation).context;

        if (context) {
          session.context[context] = update;
        }
      }
    }
  }

  async handleCurrentSession(update: UpdateInbound, session: FlowSession) {
    const identifier = this.getChatId(update)!;

    const flow = configs.find((item) => item.id === session.flowId);

    if (!flow) {
      logger.info(`Flow with id ${session.flowId} not found`);
      return;
    }

    const query = update.callback_query;

    if (query) {
      await telegramService.answerCallbackQuery({
        callback_query_id: query.id,
      });
    }

    this.saveToContext({ session, update });

    const nextStep = update.callback_query?.data;

    if (!nextStep) {
      logger.info(`Next step from callback query not found`);
      return;
    }

    const step = flow.steps.find((item) => item.id === nextStep);

    if (!step) {
      logger.info(`Step with id ${nextStep} not found`);
      return;
    }
    session.conversation.push({ type: "inbound", payload: update });

    await this.sendOutbound({
      identifier,
      step,
      session,
    });
  }

  async sendOutbound({
    identifier,
    step,
    session,
  }: {
    identifier: string;
    step: FlowConfigStep;
    session: FlowSession;
  }) {
    const result = await telegramService.sendMessage({
      chatId: identifier,
      ...step,
    });
    const messageId = result.body.result.message_id;
    const outbound: OutboundConversation = {
      ...step,
      message_id: messageId,
    };

    session.conversation.push({ type: "outbound", payload: outbound });
    sessions[identifier] = session;
  }

  async handleNewSession(update: UpdateInbound) {
    const identifier = update.message!.chat!.id!.toString();
    const text = update.message?.text;

    if (!text) {
      logger.info(`Empty text`);
      return;
    }

    const flow = configs.find((item) =>
      item.trigger.map((trigger) => trigger.toLowerCase()).includes(text),
    );
    if (!flow) {
      logger.info(`Flow Config with trigger ${text} not found`);
      return;
    }

    const newSession: FlowSession = {
      flowId: flow.id,
      identifier,
      context: {},
      conversation: [],
    };

    const step = flow.steps[0];

    newSession.conversation.push({ type: "inbound", payload: update });

    await this.sendOutbound({ identifier, step, session: newSession });
  }
}

export const flowService = new FlowService();
