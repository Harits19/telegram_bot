import mongoose from "mongoose";
import { FlowConfig } from "./type.js";

// $expr and reply_markup are free-form, so both stay Mixed; MongoDB 5.0+
// allows field names starting with "$", so config is stored untouched.
const httpSchema = new mongoose.Schema(
  {
    context: { type: String },
    config: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const stepSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    context: { type: String },
    http: { type: httpSchema, required: false },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const flowConfigSchema = new mongoose.Schema<FlowConfig>(
  {
    trigger: { type: [String], required: true, index: true },
    steps: { type: [stepSchema], required: true },
  },
  { collection: "flow_configs", timestamps: true },
);

export const FlowConfigModel: mongoose.Model<FlowConfig> =
  (mongoose.models.FlowConfig as mongoose.Model<FlowConfig>) ??
  mongoose.model<FlowConfig>("FlowConfig", flowConfigSchema);
