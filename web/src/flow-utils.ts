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

/** Kesalahan yang menghalangi simpan. Kosong berarti valid. */
export function validateFlow(flow: FlowConfig, others: FlowConfig[]): string[] {
  const errors: string[] = [];

  if (!/^[a-zA-Z0-9_-]+$/.test(flow.id)) {
    errors.push("ID flow wajib, hanya huruf/angka/-/_.");
  } else if (others.some((item) => item.id === flow.id)) {
    errors.push(`ID flow "${flow.id}" sudah dipakai flow lain.`);
  }

  if (flow.trigger.length === 0) {
    errors.push("Minimal satu trigger.");
  }

  if (flow.steps.length === 0) {
    errors.push("Minimal satu step.");
  }

  if (flow.steps[0] && flow.steps[0].id.trim() === "") {
    errors.push("Step pertama butuh ID: dipakai sebagai step awal flow.");
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
      errors.push(
        `Step "${id}" tidak punya isi response (text/photo/$expr).`,
      );
    }
  }

  for (const step of flow.steps) {
    const target = step.response.reply_markup?.inline_keyboard ?? [];
    for (const row of target) {
      for (const button of row) {
        if (button.text.trim() === "") {
          errors.push(`Step "${step.id}" punya tombol tanpa teks.`);
        }
        if (!button.callback_data && !button.url) {
          errors.push(
            `Tombol "${button.text || "(kosong)"}" di step "${step.id}" butuh callback_data atau url.`,
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
