import axios, { AxiosResponse } from "axios";
import { Logger, logger } from "../config/logger.js";
import { telegramService } from "../telegram/service.js";
import { MessageOutbound, UpdateInbound } from "../telegram/type.js";
import { FlowConfig, FlowConfigStep, OutboundConversation } from "./type.js";
import { flowRepository } from "./repository.js";
import { Session } from "../session/type.js";
import { sessionRepository } from "../session/repository.js";

class FlowService {
  logger = new Logger(FlowService);

  getChatId(update: UpdateInbound) {
    const id =
      update.message?.chat?.id || update.callback_query?.message?.chat.id;

    return id?.toString();
  }
  async digest(update: UpdateInbound) {
    const logger = this.logger.nested(this.digest);
    const identifier = this.getChatId(update);

    logger.debug(`update ${JSON.stringify(update, null, 2)}`);

    if (!identifier) {
      logger.warn(`Empty chat id`);
      return;
    }
    const session = await sessionRepository.findByIdentifier({ identifier });
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
    session: Session;
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

  async handleCurrentSession(update: UpdateInbound, session: Session) {
    const identifier = this.getChatId(update)!;

    const flow = await flowRepository.findById({ id: session.flowId });

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

  async handleHTTP({
    step,
    session,
  }: {
    step: FlowConfigStep;
    session: Session;
  }) {
    const logger = this.logger.nested(this.handleHTTP);
    let response: AxiosResponse | undefined = undefined;
    const http = step.http;
    const context = http?.context;

    try {
      if (!http) return;
      response = await axios(http.config);
      logger.info(
        `success called http with response ${JSON.stringify(response?.data, null, 2)}`,
      );
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        response = error.response?.data;
        logger.error(
          `error while calling http ${JSON.stringify(error, null, 2)}`,
        );
      } else {
        logger.error(`Error ${error?.stack || "Unexpected error"}`);
      }
    }
    if (response && context) {
      session.context[context] = {
        status: response.status,
        data: response.data,
      };
    }
  }

  handleExpr({ step, session }: { step: FlowConfigStep; session: Session }) {
    const expr = step.response.$expr;

    if (!expr) return step.response;
    const context = session.context;
    const response = eval(expr);
    return response as MessageOutbound;
  }

  async sendOutbound({
    identifier,
    step,
    session,
  }: {
    identifier: string;
    step: FlowConfigStep;
    session: Session;
  }) {
    await this.handleHTTP({ step, session });
    const response = this.handleExpr({ session, step });

    const result = await telegramService.sendMessage({
      chatId: identifier,
      ...response,
    });
    const messageId = result.body.result.message_id;
    const outbound: OutboundConversation = {
      ...step,
      message_id: messageId,
    };

    session.conversation.push({ type: "outbound", payload: outbound });

    await sessionRepository.updateByIdentifier({ identifier, session });
  }

  async handleNewSession(update: UpdateInbound) {
    const identifier = update.message!.chat!.id!.toString();
    const text = update.message?.text;

    if (!text) {
      logger.info(`Empty text`);
      return;
    }

    const flow = await flowRepository.findByTrigger({ trigger: text });
    if (!flow) {
      logger.info(`Flow Config with trigger ${text} not found`);
      return;
    }

    const newSession: Session = {
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

const response = {
  status: true,
  message: "success",
  data: {
    id: "eda80a3d5b344bc40f3bc04f65b7a357",
    kabko: "KOTA KEDIRI",
    prov: "JAWA TIMUR",
    jadwal: {
      "2026-09-21": {
        tanggal: "Senin, 21/09/2026",
        imsak: "03:57",
        subuh: "04:07",
        terbit: "05:19",
        dhuha: "05:46",
        dzuhur: "11:29",
        ashar: "14:41",
        maghrib: "17:31",
        isya: "18:40",
      },
    },
  },
};
