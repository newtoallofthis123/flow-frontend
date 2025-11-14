export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4949',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4949/socket',
  appName: import.meta.env.VITE_APP_NAME || 'Flow CRM',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const

