# HoloStem Full-Stack Scaffold

HoloStem now includes a real backend API + database schema foundation:

- JWT auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- User profile API (`/api/users/:username`, `/api/users/me/profile`)
- Video feed and uploads (`/api/videos/feed`, `/api/videos/upload`)
- Like and comment APIs (`/api/videos/:videoId/like`, comments endpoints)
- Public watch feed (no account required), authenticated uploads/profile editing

## Run Locally

1. Install dependencies
2. Copy env file
3. Push Prisma schema
4. Start API and frontend together

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev:full
```

Frontend: `http://localhost:5173`  
API: `http://localhost:4000`

## Required Environment Variables

- `DATABASE_URL` (example: `file:./dev.db`)
- `JWT_SECRET`
- `CORS_ORIGIN` (example: `http://localhost:5173`)
- `PORT` (default `4000`)
- `VITE_API_BASE_URL` (default `http://localhost:4000/api`)

## Vercel Note

Vercel hosts the React frontend. The API needs a backend host
(e.g. Render, Railway, Fly.io, or Supabase edge/functions).
Keep `vercel.json` rewrite for SPA routing.
