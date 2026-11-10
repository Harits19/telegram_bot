import { Logger } from "../config/logger.js";
import { SessionModel } from "./model.js";
import { Session } from "./type.js";

class SessionRepository {
  logger = new Logger(this);

  async findByIdentifier({ identifier }: { identifier: string }) {
    const result = await SessionModel.findOne({ identifier }).lean();
    return result;
  }

  async updateByIdentifier({
    identifier,
    session,
  }: {
    identifier: string;
    session: Session;
  }) {
    await SessionModel.updateOne({ identifier }, session, { upsert: true });
  }
}

export const sessionRepository = new SessionRepository();
