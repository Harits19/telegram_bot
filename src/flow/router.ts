import { RequestHandler, Router } from "express";
import mongoose from "mongoose";
import { FlowConfigInput, flowRepository } from "./repository.js";
import { FlowConfig, FlowConfigStep } from "./type.js";

// Express 4 does not forward rejected promises, so every handler goes through this.
const wrap =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

function toFlow(document: FlowConfig) {
  return {
    id: document._id.toString(),
    trigger: document.trigger,
    steps: document.steps,
  };
}

/** Rejects anything the bot cannot replay; free-form fields inside a step stay untouched. */
function parseInput(body: unknown): { error: string } | { value: FlowConfigInput } {
  if (typeof body !== "object" || body === null) {
    return { error: "Body must be a JSON object" };
  }

  const { trigger, steps } = body as { trigger?: unknown; steps?: unknown };

  if (!Array.isArray(trigger) || trigger.length === 0) {
    return { error: "trigger must be a non-empty array of strings" };
  }
  if (!trigger.every((item) => typeof item === "string" && item.trim() !== "")) {
    return { error: "every trigger must be a non-empty string" };
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return { error: "steps must be a non-empty array" };
  }

  const stepIds = new Set<string>();
  for (const step of steps as FlowConfigStep[]) {
    if (typeof step !== "object" || step === null) {
      return { error: "every step must be an object" };
    }
    if (typeof step.id !== "string" || step.id.trim() === "") {
      return { error: "every step needs a non-empty string id" };
    }
    if (stepIds.has(step.id)) {
      return { error: `duplicate step id "${step.id}"` };
    }
    stepIds.add(step.id);

    if (typeof step.response !== "object" || step.response === null) {
      return { error: `step "${step.id}" needs a response object` };
    }
  }

  return { value: { trigger: trigger.map((item) => item.trim()), steps } };
}

const router = Router();

router.get(
  "/",
  wrap(async (_request, response) => {
    const flows = await flowRepository.list();
    response.json(flows.map(toFlow));
  }),
);

router.get(
  "/:id",
  wrap(async (request, response) => {
    const id = request.params.id;

    if (!mongoose.isValidObjectId(id)) {
      response.status(404).json({ error: "Flow not found" });
      return;
    }

    const flow = await flowRepository.findById({ id });
    if (!flow) {
      response.status(404).json({ error: "Flow not found" });
      return;
    }

    response.json(toFlow(flow));
  }),
);

router.post(
  "/",
  wrap(async (request, response) => {
    const parsed = parseInput(request.body);
    if ("error" in parsed) {
      response.status(400).json({ error: parsed.error });
      return;
    }

    const flow = await flowRepository.create(parsed.value);
    response.status(201).json(toFlow(flow));
  }),
);

router.put(
  "/:id",
  wrap(async (request, response) => {
    const id = request.params.id;

    if (!mongoose.isValidObjectId(id)) {
      response.status(404).json({ error: "Flow not found" });
      return;
    }

    const parsed = parseInput(request.body);
    if ("error" in parsed) {
      response.status(400).json({ error: parsed.error });
      return;
    }

    const flow = await flowRepository.update({ id, ...parsed.value });
    if (!flow) {
      response.status(404).json({ error: "Flow not found" });
      return;
    }

    response.json(toFlow(flow));
  }),
);

router.delete(
  "/:id",
  wrap(async (request, response) => {
    const id = request.params.id;

    if (!mongoose.isValidObjectId(id)) {
      response.status(404).json({ error: "Flow not found" });
      return;
    }

    const flow = await flowRepository.remove({ id });
    if (!flow) {
      response.status(404).json({ error: "Flow not found" });
      return;
    }

    response.status(204).end();
  }),
);

export const flowRouter = router;
