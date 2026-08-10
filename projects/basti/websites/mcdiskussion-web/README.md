# BastiLd Mod Hub

A fast, accessible, dark-themed, bilingual (English / German) static website that
showcases the **RestoreInventory** Fabric mod and leaves room for future mods.

No build tooling — plain HTML/CSS/JS with a few libraries loaded from CDNs. It runs as-is
on GitHub Pages.

Highlights:

- 🌓 Dark theme with a warm amber accent (one-line re-skin via `--accent-color`)
- 🌐 Full EN/DE translations, persisted in `localStorage`
- ✨ Signature heading hover, magnetic buttons, spotlight cursor, scroll reveal, 3D tilt
  cards, GSAP text scramble — all disabled under `prefers-reduced-motion`
- 🕹️ **Paddle Force (Original)** — the original game by Flobotron, © 2019 Luke Pacholski,
  Bobby Richter & Devon Bird, hosted in `paddleforce/` with the developers' permission
  (`game.html` wraps it full-screen)
- 🕹️ **Paddle Force Classic** — BastiLd's remake: territory-capture Pong (vs CPU / 2-player /
  CPU-vs-CPU demo, best-of 3/5/7 rounds, 6 power-ups, keyboard + gamepad + touch, synth SFX)
  on `game-classic.html`, plus a Memory bonus game
- 💬 Supabase-backed comments with nested replies, realtime updates, honeypot + rate limit
- 🔗 Hash-anchor navigation (`#restoreinventory`, `#games`, …) using the View Transitions API

## Project structure

```
index.html                 Main page: nav + all sections
game.html                  Paddle Force (Original) — full-screen iframe wrapper
paddleforce/               The original game by Flobotron (HTML, JS, art, music, sounds)
game-classic.html          Paddle Force Classic — BastiLd's remake (standalone page)
mod-editor.html            Admin-only mod card editor (content + grid/free layout)
css/style.css              Global styles (theme, layout, animations)
css/game.css               Styles for the Classic remake page
js/config.js               Supabase URL + anon key (single source of truth)
js/i18n.js                 EN/DE translation tables + setLanguage()
js/app.js                  Navigation, i18n wiring, signature animations
js/paddleforce.js          Classic remake game logic (loaded by js/game-boot.js)
js/games.js                Games entry point + Memory game
js/comments.js             Supabase comments
.github/workflows/deploy.yml   Auto-deploy to GitHub Pages on push to main
.nojekyll                  Tell Pages not to run Jekyll
```

## Local preview

ES modules require `http://` (not `file://`). Serve the folder with any static server:

```bash
# Python 3
python -m http.server 8000
# or Node
npx serve .
```

Then open <http://localhost:8000>. In VS Code you can also use the **Live Server** extension.

## Supabase setup (one-time)

The comments feature needs a `comments` table. The project URL and **public anon key** are
already wired in [`js/config.js`](js/config.js) — the anon key is a client-side key protected
by Row Level Security, so it's safe to commit.

1. Open your Supabase project → **SQL Editor** → run this once:

   ```sql
   create extension if not exists "uuid-ossp";

   create table if not exists public.comments (
     id uuid primary key default uuid_generate_v4(),
     project_id text not null,
     author_name text not null check (char_length(author_name) <= 50),
     body text not null check (char_length(body) <= 1000),
     parent_id uuid references public.comments(id) on delete cascade,
     created_at timestamptz not null default now(),
     status text not null default 'visible' check (status in ('visible','hidden','deleted'))
   );

   alter table public.comments enable row level security;

   create policy "Public comments are visible" on public.comments
     for select using (status = 'visible');

   create policy "Anonymous can insert visible comments" on public.comments
     for insert with check (
       status = 'visible' and
       project_id is not null and author_name is not null and body is not null and
       char_length(author_name) > 0 and char_length(body) > 0
     );
   ```

2. **(Optional, for live updates)** Enable Realtime for the table so new comments appear
   without a refresh:

   ```sql
   alter publication supabase_realtime add table public.comments;
   ```

   Or in the dashboard: **Database → Replication →** add `public.comments`. The site still
   works without this — a posted comment is rendered immediately; it just won't stream in
   from *other* visitors until they reload.

> The URL in `js/config.js` is the API endpoint (`https://<ref>.supabase.co`), derived from
> the project ref — **not** the dashboard URL. If you swap projects, update both constants.

## Admin dashboard (one-time setup)

The site has a private **Dashboard** (reachable via the 🔒 button in the nav, route `#admin`)
that only the owner can use after logging in. It shows visitor stats (page views, downloads,
game starts, section views) and lets you moderate every comment (reply / hide / show / delete).
Authorisation is enforced by Postgres RLS — not just the UI.

### 1. Create the analytics + admin tables

In the Supabase **SQL Editor**, run this once:

```sql
-- ===== Analytics events =====
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (char_length(type) <= 40),
  label text check (char_length(label) <= 160),
  path text check (char_length(path) <= 200),
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;

create policy "Anyone can insert events" on public.events
  for insert with check (type is not null and char_length(type) > 0);

-- ===== Admins =====
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create policy "Admins can read own admin row" on public.admins
  for select using (auth.uid() = user_id);

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Admins can read analytics
create policy "Admins can read events" on public.events
  for select using (public.is_admin());

-- Admins can moderate comments (see all + update + delete)
create policy "Admins can read all comments" on public.comments
  for select using (public.is_admin());
create policy "Admins can update comments" on public.comments
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete comments" on public.comments
  for delete using (public.is_admin());
```

### 2. Create your login

In Supabase: **Authentication → Users → Add user**. Enter your email + a password and tick
**Auto Confirm User**. (Email/password sign-in is enabled by default.)

### 3. Make that user an admin

Run this once (replace the email if different):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'herringerr912@gmail.com'
on conflict (user_id) do nothing;
```

That's it. Open the site, click 🔒, sign in — the **Dashboard** tab appears. Your own visits
aren't counted in the stats while you're logged in.

## Dynamic mods (one-time setup)

The **Mods** section renders from a Supabase-cached table. In the dashboard you add a mod by
entering its **Modrinth slug** and/or **GitHub repo** — name, icon, description, downloads and
versions are fetched automatically from the public APIs and stored; visitors only ever read
the cache (no API rate-limit issues).

Run this once in the Supabase **SQL Editor**:

```sql
create table if not exists public.mods (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  summary_en text,
  summary_de text,
  icon_url text,
  modrinth_slug text,
  github_repo text,
  downloads integer not null default 0,
  followers integer not null default 0,
  latest_version text,
  game_versions jsonb,
  modrinth_url text,
  github_url text,
  data jsonb,
  sort integer not null default 0,
  visible boolean not null default true,
  fetched_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.mods enable row level security;

create policy "Public can read visible mods" on public.mods
  for select using (visible = true or public.is_admin());

create policy "Admins manage mods" on public.mods
  for all using (public.is_admin()) with check (public.is_admin());
```

Then: Dashboard → **Manage mods** → enter e.g. `restoreinv` (Modrinth) and/or
`BastiLd/Restore-Inv` (GitHub) → **Fetch info** → review → **Save mod**. Use **Refresh data**
on a mod row to re-pull download counts whenever you like.

## Deploy to GitHub Pages

### Option A — GitHub Actions (included)

1. Create a repo (e.g. `bastild-mod-hub`) and push these files to `main`.
2. In **Settings → Pages → Build and deployment**, set **Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` deploys on every push to `main`.

### Option B — branch / root (no Actions)

1. Push to `main`.
2. **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The `.nojekyll` file ensures the `js/` folder is served untouched.

After it builds, the site is live at `https://<username>.github.io/<repository>/`.

In the Modrinth project's **Website** field, link directly to the mod section:
`https://<username>.github.io/<repository>/#restoreinventory`.

## Customizing

- **Accent color:** change `--accent-color` (and `--accent-strong`) in `css/style.css`.
- **Translations:** edit the `en` / `de` objects in `js/i18n.js`. Mark new elements with
  `data-i18n="key"` (text) or `data-i18n-attr="placeholder:key"` (attributes).
- **Add a mod section:** copy the `#restoreinventory` `<section>`, give it a new `id`, add it
  to `SECTIONS` in `js/app.js`, add a nav link, and set a unique `data-project` on its
  comments block.

## Credits

Built with vanilla HTML/CSS/JS plus [GSAP](https://gsap.com/),
[vanilla-tilt.js](https://micku7zu.github.io/vanilla-tilt.js/) and
[supabase-js](https://supabase.com/). MIT licensed.
