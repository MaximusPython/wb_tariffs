import dotenv from 'dotenv';
dotenv.config();

export interface Env {
  wbApiUrl: string;
  wbToken: string;
  pg: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  sheets: {
    ids: string[];
    credentialsBase64: string;
  };
  cron: {
    wbFetch: string;
    sheetsUpdate: string;
  };
  port: number;
}

export const env: Env = {
  wbApiUrl: process.env.WB_API_URL || "https://common-api.wildberries.ru",
  wbToken: process.env.WB_API_TOKEN || "",
  pg: {
    host: process.env.PG_HOST || "db",
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "postgres",
    database: process.env.PG_DATABASE || "postgres",
  },
  sheets: {
    ids: (process.env.SHEETS_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    credentialsBase64: process.env.GOOGLE_SA_CREDENTIALS_BASE64 || "",
  },
  cron: {
    wbFetch: process.env.CRON_WB_FETCH || "0 * * * *",
    sheetsUpdate: process.env.CRON_SHEETS_UPDATE || "0 2 * * *",
  },
  port: Number(process.env.PORT || 3000),
};
