import { Logger, logger } from "../config/logger.js";
import { telegramService } from "../telegram/service.js";
import { UpdateInbound } from "../telegram/type.js";
import { FlowConfig, FlowSession } from "./type.js";
const sessions: Record<string, FlowSession> = {};
const configs: FlowConfig[] = [
  {
    id: "id-123",
    trigger: ["halo", "hi"],
    steps: [
      {
        id: "greeting",
        text: "Halo Kembali",
        reply_markup: {
          inline_keyboard: [[{ text: "Next", callback_data: "ask_wants" }]],
        },
      },

      {
        id: "ask_wants",
        text: "Sedang mencari apa?",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Info Cuaca", callback_data: "info_cuaca" },
              { text: "Info Jadwal Sholat", callback_data: "info_waktu" },
            ],
          ],
        },
      },

      {
        id: "info_cuaca",
        text: "Info cuaca di jakarta",
      },

      {
        id: "info_waktu",
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

    await telegramService.sendMessage({
      chatId: identifier,
      ...step,
    });

    session.conversation.push({ type: "outbound", payload: step });
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

    await telegramService.sendMessage({
      chatId: identifier,
      ...step,
    });

    newSession.conversation.push({ type: "outbound", payload: step });

    sessions[identifier] = newSession;
  }
}

export const flowService = new FlowService();
