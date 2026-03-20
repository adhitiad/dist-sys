// src/lib/logger.ts
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;
const isProd = process.env.NODE_ENV === "production";

const consoleFmt = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const m = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
  return `${ts} [${level}] ${stack || message}${m}`;
});

const rotateOpts = (filename: string, level?: string) => ({
  filename:     path.join(process.cwd(), "logs", `%DATE%-${filename}.log`),
  datePattern:  "YYYY-MM-DD",
  zippedArchive: true,
  maxSize:      "20m",
  maxFiles:     "30d",
  ...(level ? { level } : {}),
  format: combine(timestamp(), errors({ stack: true }), json()),
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  format: combine(errors({ stack: true }), timestamp({ format: "YYYY-MM-DD HH:mm:ss" })),
  defaultMeta: { service: "distributor-system" },
  transports: [
    new winston.transports.Console({
      format: combine(colorize({ all: true }), timestamp({ format: "HH:mm:ss" }), consoleFmt),
    }),
    ...(isProd
      ? [
          new DailyRotateFile(rotateOpts("combined")),
          new DailyRotateFile(rotateOpts("error", "error")),
        ]
      : []),
  ],
  exitOnError: false,
});

export function logApiError(error: unknown, ctx: { endpoint: string; method: string; userId?: string }) {
  logger.error("API Error", {
    ...ctx,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
