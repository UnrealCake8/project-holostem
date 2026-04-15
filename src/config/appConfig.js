export const appConfig = {
  appName: 'HoloStem',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  featureFlags: {
    enablePremium: true,
    enableVoiceCall: true,
    enableVideoCall: true,
    enableModeration: true,
  },
}
