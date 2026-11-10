import type { FlowConfig, FlowConfigStep } from "./types";

export function emptyFlow(): FlowConfig {
  return {
    id: "",
    trigger: [],
    steps: [emptyStep(0)],
  };
}

export function emptyStep(index: number): FlowConfigStep {
  return {
    id: index === 0 ? "greeting" : `step_${index + 1}`,
    response: { text: "" },
  };
}

export function cloneFlow(flow: FlowConfig): FlowConfig {
  return structuredClone(flow);
}

/** Problems that block saving. Empty means valid. */
export function validateFlow(flow: FlowConfig): string[] {
  const errors: string[] = [];

  if (flow.trigger.length === 0) {
    errors.push("Minimal satu trigger.");
  }

  if (flow.steps.length === 0) {
    errors.push("Minimal satu step.");
  }

  const stepIds = new Set<string>();
  for (const step of flow.steps) {
    const id = step.id.trim();
    if (id === "") {
      errors.push("Ada step tanpa ID.");
      continue;
    }
    if (stepIds.has(id)) errors.push(`ID step "${id}" dobel.`);
    stepIds.add(id);

    const response = step.response;
    const hasContent =
      (response.$expr ?? "").trim() !== "" ||
      (response.photo ?? "").trim() !== "" ||
      (response.text ?? "").trim() !== "";
    if (!hasContent) {
      errors.push(`Step "${id}" tidak punya isi response (text/photo/$expr).`);
    }
  }

  for (const step of flow.steps) {
    const rows =
      step.response.reply_markup?.inline_keyboard ??
      step.response.reply_markup?.keyboard ??
      [];

    for (const row of rows) {
      for (const button of row) {
        if (button.text.trim() === "") {
          errors.push(`Step "${step.id}" punya tombol tanpa teks.`);
        }
        if (button.url) continue;

        // A callback with no matching step leaves the user stuck on a dead button.
        if (!button.callback_data) {
          errors.push(
            `Tombol "${button.text || "(kosong)"}" di step "${step.id}" butuh callback_data atau url.`,
          );
        } else if (!stepIds.has(button.callback_data)) {
          errors.push(
            `Tombol "${button.text || "(kosong)"}" di step "${step.id}" memanggil "${button.callback_data}", ID step itu tidak ada.`,
          );
        }
      }
    }
  }

  return errors;
}

export function parseJsonObject(
  text: string,
): { value: unknown; error?: string } {
  if (text.trim() === "") return { value: undefined };
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    return { value: undefined, error: (error as Error).message };
  }
}
