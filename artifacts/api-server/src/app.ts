import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import proxyRouter from "./routes/proxy";
import { logger } from "./lib/logger";
import { restoreRunningApps } from "./lib/app-manager";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy for user-deployed apps — must come before json body parser middleware
app.use(proxyRouter);

app.use("/api", router);

// Mark any apps that were "running" at startup as stopped (since processes didn't survive restart)
restoreRunningApps().catch((err) => logger.error({ err }, "Failed to restore running apps"));

export default app;
