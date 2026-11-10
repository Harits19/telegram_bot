import mongoose from "mongoose";
import { Logger } from "../config/logger.js";

const USER = process.env.MONGO_ROOT_USERNAME ?? "admin";
const PASSWORD = process.env.MONGO_ROOT_PASSWORD ?? "admin123";
const DATABASE = process.env.MONGO_DATABASE ?? "telegram_bot";
const PORT = process.env.MONGO_PORT ?? "27017";

/** URI bisa ditimpa langsung lewat MONGODB_URI (mis. ke Atlas). */
const MONGODB_URI =
  process.env.MONGODB_URI ??
  `mongodb://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?authSource=admin`;

class MongoDB {
  logger = new Logger(this);

  async connect() {
    const logger = this.logger.nested(this.connect);

    // Jangan buka koneksi kedua saat hot reload.
    if (mongoose.connection.readyState !== 0) {
      return;
    }

    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      logger.info(`tersambung ke database "${DATABASE}"`);
    } catch (error) {
      // Gagal konek = service tidak bisa jalan, jadi lempar ke pemanggil.
      logger.error("gagal tersambung", error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }
}

export const mongoDB = new MongoDB();
