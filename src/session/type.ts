import { InboundConversation, OutboundConversation } from "../flow/type.js";

export interface Session {
  flowId: string;
  identifier?: string;
  context: Record<string, unknown>;
  conversation: (
    | { type: "outbound"; payload: OutboundConversation }
    | { type: "inbound"; payload: InboundConversation }
  )[];
}