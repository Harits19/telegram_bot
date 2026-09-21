export type Button = {
  text: string;
  callback_data?: string;
  url?: string;
  request_location?: boolean;
};

export interface MessageOutbound {
  text: string;
  reply_markup?: {
    keyboard?: Button[][];
    inline_keyboard?: Button[][];
  };
}

// --- pesan masuk ---

export interface UserInbound {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ChatInbound {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface MessageEntityInbound {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: UserInbound;
}

export interface MessageInbound {
  message_id: number;
  date: number;
  chat: ChatInbound;
  from?: UserInbound;
  text?: string;
  caption?: string;
  entities?: MessageEntityInbound[];
  message_thread_id?: number;
  reply_to_message?: MessageInbound;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface CallbackQueryInbound {
  id: string;
  from: UserInbound;
  chat_instance: string;
  data?: string;
  message?: MessageInbound;
}

export interface UpdateInbound {
  update_id: number;
  message?: MessageInbound;
  edited_message?: MessageInbound;
  channel_post?: MessageInbound;
  edited_channel_post?: MessageInbound;
  callback_query?: CallbackQueryInbound;
}

export interface SendMessageResponse {
  status: number;
  body: {
    ok: boolean;
    result: {
      message_id: number;
    };
  };
}
