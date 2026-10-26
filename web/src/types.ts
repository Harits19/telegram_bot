// Salinan tipe dari src/flow/type.ts + src/telegram/type.ts.
// Backend adalah sumber kebenaran; kalau bentuknya berubah, ubah file ini juga.

export type Button = {
  text: string;
  callback_data?: string;
  url?: string;
  request_location?: boolean;
};

export interface MessageOutbound {
  $expr?: string;
  text?: string;
  photo?: string;
  caption?: string;
  reply_markup?: {
    keyboard?: Button[][];
    inline_keyboard?: Button[][];
  };
}

export interface HttpConfig {
  method?: string;
  url?: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export interface FlowConfigStep {
  id: string;
  http?: { context?: string; config: HttpConfig };
  context?: string;
  response: MessageOutbound;
}

export interface FlowConfig {
  id: string;
  trigger: string[];
  steps: FlowConfigStep[];
}
