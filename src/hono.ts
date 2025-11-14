import { Hono } from "hono";
import { honoLog } from "./logger.js";
import { healthcheckRoute } from "./healthcheck.js";

export const app = new Hono();

const log = honoLog;

app.use("*", async (c, next) => {
  const { method, path } = c.req;
  const start = Date.now();

  log.info(`<-- ${method} ${path}`);

  const res = await next();

  const duration = Date.now() - start;
  log.info(`--> ${method} ${path} ${c.res.status} ${duration}ms`);

  return res;
});

app.get("/", (c) => c.redirect("https://parthkoshti.com"));

app.route("/api/healthcheck", healthcheckRoute);
