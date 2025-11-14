// filename: instrumentation.ts
import "dotenv/config";
import { logs, NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";

const baseUrl =
  process.env.SIGNOZ_OTEL_COLLECTOR_URL ?? "http://localhost:4318";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    "service.name": "greensec-revops-app",
    "service.version": "1.0.0",
    "deployment.environment": process.env.NODE_ENV ?? "development",
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${baseUrl}/v1/traces`,
  }),
  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${baseUrl}/v1/metrics`,
      }),
    }),
  ],
  logRecordProcessors: [
    new logs.BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `${baseUrl}/v1/logs`,
      })
    ),
  ],
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PinoInstrumentation({
      logKeys: {
        traceId: "myTraceId",
        spanId: "mySpanId",
        traceFlags: "myTraceFlags",
      },
    }),
  ],
});

sdk.start();
