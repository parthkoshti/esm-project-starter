import "dotenv/config";
import "./instrumentation.js";

import { serve } from "@hono/node-server";
import { app } from "./hono.js";
import { logger } from "./logger.js";

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  try {
    serve({
      port: PORT,
      fetch: app.fetch,
    });

    logger.info("Revops server started");
    logger.info(`Listening on http://localhost:${PORT}`);

    if (process.env.NODE_ENV === "production") {
      logger.info("🔥🔥🔥 Production mode 🔥🔥🔥");
    } else {
      logger.info("🍳🍳🍳 Development mode 🍳🍳🍳");
    }
  } catch (err) {
    logger.error({ err }, "Error in start");
    throw err;
  }
}

start();
