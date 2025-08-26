export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SHEETS_IDS?: string
      GOOGLE_SA_CREDENTIALS_BASE64?: string
    }
  }
}
