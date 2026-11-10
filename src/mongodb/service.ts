import mongoose from "mongoose";
import { Logger } from "../config/logger.js";

/** MONGODB_URI overrides the whole connection string (e.g. an Atlas cluster). */
const MONGODB_URI = process.env.MONGODB_URI;

class MongoDB {
  logger = new Logger(this);

  async connect() {
    const logger = this.logger.nested(this.connect);

    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI kosong: isi di .env (lihat contoh di .env.example)",
      );
    }

    // Hot reload must not open a second connection.
    if (mongoose.connection.readyState !== 0) {
      logger.info(`database "${mongoose.connection.name}" sudah tersambung`);
      return;
    }

    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`tersambung ke database "${mongoose.connection.name}"`);
    } catch (error) {
      // Without a database the service cannot run, so the caller gets the error.
      logger.error("gagal tersambung", error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }
}

export const mongoDB = new MongoDB();
