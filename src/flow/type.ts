import { AxiosRequestConfig } from "axios";
import { MessageOutbound, UpdateInbound } from "../telegram/type.js";

export interface OutboundConversation extends FlowConfigStep {
  message_id: number;
}

export interface InboundConversation extends UpdateInbound {}



export interface FlowConfig {
  id: string;
  trigger: string[];
  steps: FlowConfigStep[];
}

export interface FlowConfigStep {
  id: string;
  http?: { context?: string; config: AxiosRequestConfig };
  context?: string;
  response: MessageOutbound;
}
