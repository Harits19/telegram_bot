import { Logger } from "../config/logger.js";
import { Session } from "./type.js";

const sessions: Record<string, Session> = {};

class SessionRepository {
  logger = new Logger(this);

  async findByIdentifier({ identifier }: { identifier: string }) {
    this.showCurrentState();
    return sessions[identifier];
  }

  async updateByIdentifier({
    identifier,
    session,
  }: {
    identifier: string;
    session: Session;
  }) {
    sessions[identifier] = session;
    this.showCurrentState();
  }

  async showCurrentState() {
    const logger = this.logger.nested(this.showCurrentState);

    logger.info(`current state ${JSON.stringify(sessions, null, 2)}`);
  }
}

export const sessionRepository = new SessionRepository();
