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
- ✅ Deploy-ready for Vercel

---

## Tech stack

- React + Vite
- Tailwind CSS
- Supabase (Auth + Postgres)

---

## Pages included

- `/auth` — login/sign up
- `/dashboard` — personalized feed + content browser/search/filter
- `/content/:id` — content viewer page
- `/profile` — user profile editor
- `/settings` — accessibility + UI options
- `/admin` — simple content uploader (optional extra)

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
3. Run SQL in `supabase/schema.sql` using the Supabase SQL editor.
4. In Supabase Auth settings, allow email/password login.

### Required env vars

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 3) Database schema

`supabase/schema.sql` creates:

- `profiles`
- `contents`
- `user_progress`
- `user_views`

And includes starter content rows for quick testing.

---

## 4) Features implemented

### Interactive Content System
- Grid browsing UI with search and type filter.
- Supported content types:
  - `video`
  - `lesson`
  - `mini`
- Clicking opens `/content/:id` viewer.

### Personalized Feed
- Recommended content
- Recently viewed content
- Trending content

### Engagement / Progress
- “Mark as complete” awards points.
- Dashboard shows points, completed count, and level.

### Accessibility + Inclusivity
- Large text toggle
- Simple mode toggle
- Mobile/tablet first responsive layout

---

## 5) Deploy to Vercel

1. Push repo to GitHub.
2. Import into Vercel.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project environment variables.
4. Deploy.

No custom server is required for this frontend-Supabase architecture.
