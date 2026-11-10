import { FlowConfigModel } from "./model.js";
import { defaultFlowConfig, FlowConfig } from "./type.js";
import mongoose from "mongoose";

const configs: FlowConfig[] = [];

class FlowRepository {
  async findByTrigger({ trigger }: { trigger: string }) {
    const result = await FlowConfigModel.findOne({
      trigger: { $in: [trigger] },
    }).lean();
    return result;
  }

  async findById({ id }: { id: string }) {
    const result = await FlowConfigModel.findById(id).lean();
    return result;
  }

  async initFlowConfig() {
    const isFirstTime = await FlowConfigModel.countDocuments({}).lean();
    if (isFirstTime === 0) {
      await FlowConfigModel.create(defaultFlowConfig);
    }
  }
}

export const flowRepository = new FlowRepository();
