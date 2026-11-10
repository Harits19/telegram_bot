import { FlowConfigModel } from "./model.js";
import { defaultFlowConfig, FlowConfig, FlowConfigStep } from "./type.js";
import mongoose from "mongoose";

export type FlowConfigInput = {
  trigger: string[];
  steps: FlowConfigStep[];
};

class FlowRepository {
  async list() {
    const result = await FlowConfigModel.find({}).sort({ _id: 1 }).lean();
    return result;
  }

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

  async create({ trigger, steps }: FlowConfigInput) {
    const result = await FlowConfigModel.create({ trigger, steps });
    return result.toObject();
  }

  async update({ id, trigger, steps }: FlowConfigInput & { id: string }) {
    const result = await FlowConfigModel.findByIdAndUpdate(
      id,
      { trigger, steps },
      { returnDocument: "after" },
    ).lean();
    return result;
  }

  async remove({ id }: { id: string }) {
    const result = await FlowConfigModel.findByIdAndDelete(id).lean();
    return result;
  }

  async initFlowConfig() {
    // An earlier schema indexed a client-supplied `id`; the unique index caps the
    // collection at one document without that field, so drop it on sight.
    const indexes = await FlowConfigModel.collection.indexes().catch(() => []);
    if (indexes.some((index) => index.name === "id_1")) {
      await FlowConfigModel.collection.dropIndex("id_1");
    }

    const isFirstTime = await FlowConfigModel.countDocuments({}).lean();
    if (isFirstTime === 0) {
      await FlowConfigModel.create(defaultFlowConfig);
    }
  }
}

export const flowRepository = new FlowRepository();
