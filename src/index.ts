import express, { ErrorRequestHandler } from "express";
import { Logger } from "./config/logger.js";
import { flowRepository } from "./flow/repository.js";
import { flowRouter } from "./flow/router.js";
import { flowService } from "./flow/service.js";
import { mongoDB } from "./mongodb/service.js";
import { telegramService } from "./telegram/service.js";
import { UpdateInbound } from "./telegram/type.js";

// Defaults live in code; override them from .env.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const API_BASE = process.env.API_BASE ?? "https://api.telegram.org";
const PORT = Number(process.env.PORT ?? 3000);

if (TOKEN === "") {
  console.warn(
    "TELEGRAM_BOT_TOKEN is empty: set it in .env (see the example in README)",
  );
}

/** Call one Bot API method; returns its status and JSON body. */
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

/** HTTP surface: CRUD for flow configs plus the built admin UI when present. */
function createServer() {
  const app = express();
  const logger = new Logger(createServer);

  app.use(express.json({ limit: "1mb" }));
  app.use("/api/flows", flowRouter);
  app.use(express.static("web/dist"));

  // Malformed JSON and other handler errors must reach the client as JSON.
  const onError: ErrorRequestHandler = (error, _request, response, _next) => {
    logger.error("request failed", error);
    response.status(500).json({ error: "Internal server error" });
  };
  app.use(onError);

  return app;
}

async function main(): Promise<void> {
  await mongoDB.connect();
  await flowRepository.initFlowConfig();

  createServer().listen(PORT, () => {
    console.info(`admin API listening on http://localhost:${PORT}/api/flows`);
  });

  await poll();
}

void main();
