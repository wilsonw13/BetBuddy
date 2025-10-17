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

// Export each variable directly
export const HOST = getEnv("HOST", "0.0.0.0");
export const PORT = Number(getEnv("PORT", "6767"));
export const BASE_URL = getEnv("BASE_URL", `http://localhost:${PORT}`);

export const DATABASE_URL = getEnv("DATABASE_URL", "");

export const JWT_ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET", "");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET", "");
export const JWT_ACCESS_EXPIRES_IN = getEnv("JWT_ACCESS_EXPIRES_IN", "15m");
export const JWT_REFRESH_EXPIRES_IN = getEnv("JWT_REFRESH_EXPIRES_IN", "7d");

export const GOOGLE_CLIENT_ID = getEnv("GOOGLE_CLIENT_ID", "");
export const GOOGLE_CLIENT_SECRET = getEnv("GOOGLE_CLIENT_SECRET", "");

export const RATE_LIMIT_WINDOW_MS = Number(getEnv("RATE_LIMIT_WINDOW_MS", "900000"));
export const RATE_LIMIT_MAX_REQUESTS = Number(getEnv("RATE_LIMIT_MAX_REQUESTS", "100"));

// Post-process BASE_URL into its components
const baseUrl = new URL(BASE_URL);
export const BASE_PROTOCOL = baseUrl.protocol;
export const BASE_HOST = baseUrl.hostname;
export const BASE_PORT = baseUrl.port;
export const BASE_PATH = baseUrl.pathname;

export { NODE_ENV, PROD, DEV };
