# HoloStem (React + Vite + Supabase + Tailwind)

HoloStem is a **working interactive media + learning platform** with:

- ✅ Auth (signup/login)
- ✅ Real user dashboard and profile
- ✅ Supabase-backed persistence (content, views, progress, profile)
- ✅ Interactive content system (videos, lessons, mini experiences)
- ✅ Personalized feed blocks (recommended, recently viewed, trending)
- ✅ Engagement points/progress system
- ✅ Accessibility settings (large text, simple mode)
- ✅ Mobile-first responsive UI
- ✅ TikTok-style feed layout (left nav + center vertical viewer + right action rail)
- ✅ Deploy-ready for Vercel

---

## Tech stack

- React + Vite
- Tailwind CSS
- Supabase (Auth + Postgres)

---

## Pages included

- `/auth` — login/sign up
- `/dashboard` — public TikTok-style feed + content browser/search/filter
- `/content/:id` — content viewer page
- `/u/:username` — public creator profile (videos they upload)
- `/profile` — user profile editor
- `/settings` — accessibility + UI options
- `/upload` — user video uploader (TikTok-style posting flow)

---

## 1) Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

---

## 2) Supabase setup

1. Create a Supabase project.
2. Copy your project URL + anon key into `.env`.
3. Run `supabase/001_holostem_schema.sql` in the Supabase SQL editor, then optionally run `supabase/002_storage_policies.sql` if you use the public `videos` storage bucket.
4. In Supabase Auth settings, allow email/password login.

### Required env vars

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AUTH_REDIRECT_URL=https://your-vercel-domain.vercel.app/auth
```

> Upload troubleshooting: if uploads fail but the `videos` bucket exists, re-run `supabase/002_storage_policies.sql` so `storage.objects` policies allow authenticated users to upload into paths prefixed with their user ID (for example `USER_UUID/filename.mp4`).

### Important: fix auth redirect going to localhost

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to your production URL (e.g. `https://your-app.vercel.app`).
2. Add redirect URLs:
   - `https://your-app.vercel.app/auth`
   - `http://localhost:5173/auth` (for local dev)
3. Set `VITE_AUTH_REDIRECT_URL` in Vercel to your production `/auth` URL.

---

## 3) Bunny.net uploads on Vercel

Bunny.net uploads are handled by the `/api/bunny/upload` serverless function, so the Bunny variables must exist in the API runtime environment.

For local development, copy `.env.example` to `.env` and fill in the Bunny values there. Editing `.env.example` alone is not enough for a deployed Vercel app.

In **Vercel → Project Settings → Environment Variables**, add these variables for the environments you use, then redeploy the project:

```env
BUNNY_STORAGE_ZONE_NAME=your-storage-zone
BUNNY_STORAGE_ACCESS_KEY=your-storage-api-key
BUNNY_STORAGE_REGION=ny # optional; leave blank/remove for Bunny's default storage hostname
BUNNY_PULL_ZONE_URL=https://your-pull-zone.b-cdn.net
```

If these variables are missing from Vercel or the deployment has not been redeployed since adding them, the app will show the direct MP4 fallback message.

---

## 4) Database schema

`supabase/001_holostem_schema.sql` creates/updates:

- `profiles`
- `contents`
- `user_progress`
- `user_views`
- `liked_videos` and `comments`
- `user_follows`
- `reports` and `user_moderation`
- content pinning fields (`is_pinned`, `pinned_at`) and cached counts

It also includes starter content rows for quick testing. `supabase/002_storage_policies.sql` creates the optional public `videos` storage bucket and upload policies.

---

## 5) Features implemented

### Interactive Content System
- Grid browsing UI with search and type filter.
- Supported content types:
  - `video`
  - `lesson`
  - `mini`
- Clicking opens `/content/:id` viewer.
- Authenticated users can upload videos from `/upload` to Bunny.net through the Vercel API function, or publish a direct MP4 link fallback to the feed.

### Personalized Feed
- Recommended content
- Recently viewed content
- Trending content
- Feed is publicly viewable without login.

### Engagement / Progress
- “Mark as complete” awards points.
- Dashboard shows points, completed count, and level.
- Guest users can browse/watch, but login is required for upload, profile editing, and progress tracking.

### Accessibility + Inclusivity
- Large text toggle
- Simple mode toggle
- Mobile/tablet first responsive layout

---

## 6) Deploy to Vercel

1. Push repo to GitHub.
2. Import into Vercel.
3. Add the Supabase, auth redirect, and Bunny upload variables in Vercel project environment variables.
4. Deploy or redeploy after every environment variable change.

The Express API runs as a Vercel serverless function through `api/index.js`, so server-only variables such as `BUNNY_STORAGE_ACCESS_KEY` must be configured in Vercel and do not need a `VITE_` prefix.
