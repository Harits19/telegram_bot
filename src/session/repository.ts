import { Session } from "./type.js";

const sessions: Record<string, Session> = {};


class SessionRepository {

  async findByIdentifier({ identifier }: { identifier: string }) {
    return sessions[identifier];
  }

  async updateByIdentifier({ identifier, session }: { identifier: string; session: Session }) {
    sessions[identifier] = session;
  }


}

export const sessionRepository = new SessionRepository();
