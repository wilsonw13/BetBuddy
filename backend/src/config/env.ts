import { config } from "dotenv";

// Parse NODE_ENV first
const NODE_ENV = process.env.NODE_ENV ?? "development";
const PROD = NODE_ENV === "production";
const DEV = NODE_ENV === "development";

// Load .env files in order
config({ path: `.env.${NODE_ENV}.local` });
config({ path: `.env.${NODE_ENV}` });
config({ path: ".env.local" });
config({ path: ".env" });

// Helper to get env or default
const getEnv = (key: string, def?: string): string => process.env?.[key] || def || "";

const env = {
  HOST: getEnv("HOST", "0.0.0.0"),
  PORT: Number(getEnv("PORT", "6767")),
  BASE_URL: getEnv("BASE_URL", `http://localhost:${getEnv("PORT", "6767")}`),

  // Postgres
  DATABASE_URL: getEnv("DATABASE_URL", ""),

  // JWT settings
  JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET", ""),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", ""),
  JWT_ACCESS_EXPIRES_IN: getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),

  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID", ""),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET", ""),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Number(getEnv("RATE_LIMIT_WINDOW_MS", "900000")),
  RATE_LIMIT_MAX_REQUESTS: Number(getEnv("RATE_LIMIT_MAX_REQUESTS", "100")),
};

// Parse and validate environment variables

// Post-process BASE_URL into its components
const baseUrl = new URL(env.BASE_URL);
const BASE_PROTOCOL = baseUrl.protocol;
const BASE_HOST = baseUrl.hostname;
const BASE_PORT = baseUrl.port;
const BASE_PATH = baseUrl.pathname;

export default {
  ...env,
  BASE_PROTOCOL,
  BASE_HOST,
  BASE_PORT,
  BASE_PATH,
  NODE_ENV,
  PROD,
  DEV,
};
