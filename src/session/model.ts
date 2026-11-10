import mongoose from "mongoose";
import { Session } from "./type.js";

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["outbound", "inbound"], required: true },
    // Holds a raw Telegram update or the outbound step, so it stays Mixed.
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema<Session>(
  {
    flowId: { type: String, required: true },
    identifier: { type: String, required: true, index: true },
    context: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    conversation: { type: [conversationSchema], default: [] },
  },
  { collection: "sessions", timestamps: true },
);

export const SessionModel: mongoose.Model<Session> =
  (mongoose.models.Session as mongoose.Model<Session>) ??
  mongoose.model<Session>("Session", sessionSchema);
