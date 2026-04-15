# HoloStem PWA

HoloStem is a React + Vite progressive web app scaffold with:

- Authentication flow UI (signup/login)
- Protected app routes
- Dashboard and content modules (Watch, Listen, Play, Social, Profile, Settings)
- Local persistence for session/profile state
- PWA support via `manifest.webmanifest` and service worker
- Vercel SPA rewrite configuration

## Local Development

```bash
npm install
npm run dev
```

Open the URL printed in terminal (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

This repository is ready for Vercel deployment.

### Vercel Project Settings

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### SPA Routing Support

`vercel.json` includes a rewrite rule so routes like `/app/watch` or `/app/profile`
work on refresh instead of returning 404.

## Environment Variables

Optional:

- `VITE_API_BASE_URL` - API base URL for backend integrations

If not set, the app falls back to `https://api.example.com`.
