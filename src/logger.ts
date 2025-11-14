// filename: logger.ts
import pino from "pino";
import { logs, AnyValueMap } from "@opentelemetry/api-logs";

const otelLogger = logs.getLogger("pino-bridge");

// convert arbitrary objects to OTEL-safe attributes
function toAnyValueMap(obj?: Record<string, unknown>): AnyValueMap {
  if (!obj) return {};
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (
      value === null ||
      ["string", "number", "boolean"].includes(typeof value)
    ) {
      safe[key] = value;
    } else if (Array.isArray(value)) {
      safe[key] = value.map((v) =>
        ["string", "number", "boolean"].includes(typeof v)
          ? v
          : JSON.stringify(v)
      );
    } else {
      safe[key] = JSON.stringify(value);
    }
  }

  return safe as AnyValueMap;
}

const pinoToOtel = (
  level: string,
  baseAttrs: Record<string, unknown>,
  msg: string,
  obj?: Record<string, unknown>
) => {
  const attributes = toAnyValueMap({
    ...baseAttrs,
    ...(obj ?? {}),
  });

  otelLogger.emit({
    severityText: level.toUpperCase(),
    body: msg,
    attributes,
    // timestamp: hrtime(),
  });
};

const transport = pino.transport({
  targets: [
    {
      target: "pino-pretty",
      options: {
        colorize: true,
        levelFirst: false,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname,time,service,env", // keep level
        messageFormat: `[{process}]: {msg}`,
      },
    },
  ],
});

export const logger = pino(
  {
    base: { process: "system", env: process.env.NODE_ENV },
    hooks: {
      logMethod(args, method) {
        let msg = "";
        let obj: Record<string, unknown> | undefined;
        const bindings = this.bindings ? this.bindings() : {};

        // Handle both logger.info(msg, obj) and logger.info(obj, msg)
        if (typeof args[0] === "string") {
          msg = args[0];
          if (typeof args[1] === "object")
            obj = args[1] as Record<string, unknown>;
        } else if (typeof args[0] === "object") {
          obj = args[0] as Record<string, unknown>;
          if (typeof args[1] === "string") msg = args[1];
        }

        // ✅ Always send body + attributes
        pinoToOtel(method.name, bindings, msg || "[no message]", obj);

        // Pretty print remains unchanged
        return method.apply(this, args);
      },
    },
  },
  transport
);

export const honoLog = logger.child({ process: "Hono" });
