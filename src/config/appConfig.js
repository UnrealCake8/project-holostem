export const appConfig = {
  appName: 'HoloStem',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  featureFlags: {
    enablePremium: true,
    enableVoiceCall: true,
    enableVideoCall: true,
    enableModeration: true,
  },
}
