import { MessageOutbound, UpdateInbound } from "../telegram/type.js";

export interface FlowSession {
  flowId: string;
  identifier?: string;
  context: Record<string, unknown>;
  conversation: (
    | { type: "outbound"; payload: FlowConfigStep }
    | { type: "inbound"; payload: UpdateInbound }
  )[];
}

export interface FlowConfig {
  id: string;
  trigger: string[];
  steps: FlowConfigStep[];
}

export interface FlowConfigStep extends MessageOutbound {
  id: string;
}
