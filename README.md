# HoloStem Full-Stack Scaffold (Vercel + Cloud)

HoloStem now runs as a single Vercel project with:

- React frontend (Vite build output)
- Serverless API at `/api/*` (Express wrapped for Vercel Functions)
- Cloud database via Prisma + PostgreSQL
- Cloud-hosted media uploads via Cloudinary (video URLs + thumbnails saved in DB)

## API Endpoints

- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- User profile: `/api/users/:username`, `/api/users/me/profile`
- Videos: `/api/videos/feed`, `/api/videos/upload`
- Engagement: `/api/videos/:videoId/like`, `/api/videos/:videoId/comments`

## Run Locally

1. Install dependencies.
2. Copy env file and fill your Postgres + Cloudinary values.
3. Generate Prisma client and push schema.
4. Start backend + frontend.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev:full
```

Frontend: `http://localhost:5173`  
API: `http://localhost:4000/api`

## Deploy to Vercel (with cloud DB + cloud media)

1. Create a managed PostgreSQL database (Neon, Supabase, RDS, Railway, etc.).
2. In Vercel project settings, add environment variables from `.env.example`.
3. Connect a Cloudinary account and create an **unsigned upload preset** for videos.
4. Set your Vercel build command to `npm run build` (default for Vite).
5. Redeploy.
6. Run Prisma schema push against production DB once:

```bash
DATABASE_URL="your-production-postgres-url" npx prisma db push
```

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - long random secret
- `CORS_ORIGIN` - your Vercel app URL
- `VITE_API_BASE_URL` - `/api` on Vercel
- `CLOUDINARY_CLOUD_NAME` - your Cloudinary cloud name
- `CLOUDINARY_UPLOAD_PRESET` - unsigned preset used by backend upload route
- `MAX_VIDEO_UPLOAD_BYTES` - optional upload size cap

## Notes

- `vercel.json` rewrites `/api/*` to serverless API handler and all other routes to SPA entry.
- Local file uploads are removed; videos now stream from Cloudinary URLs.
- Prisma datasource is PostgreSQL for cloud deployment compatibility.
