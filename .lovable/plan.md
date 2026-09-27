# StreamBox — mobile-first movie discovery app

A phone-shaped app for browsing, searching and saving movies, with trailer playback and an account for your watchlist.

## One important note first

The app will use a public movie catalogue (posters, cast, ratings, trailers). It cannot host or download the actual films — that content is licensed and distributing it isn't something I can build. So:

- **Streaming player** → plays official trailers and clips in-app.
- **Downloads / offline** → saves your watchlist, posters and details for offline browsing, so the app still works with no signal. If you later get rights to real films (or your own videos), I can add true video downloads on top of this.

## What gets built

**Home**
- Poster hero for a featured film, then horizontal rows: Trending, Popular, Top Rated, Upcoming, and by genre.
- Bottom tab bar: Home, Search, Downloads, Profile.

**Search**
- Instant search by title with poster results, plus genre and year filters.

**Movie detail**
- Big backdrop, title, year, runtime, rating, overview, cast, similar titles.
- Play button opens the trailer in a full-screen player.
- "Add to Watchlist" and "Save offline" buttons.

**Downloads (offline)**
- Grid of saved titles that opens without a connection.
- Remove / clear-all controls and a sense of what's saved.

**Accounts & watchlist**
- Email + password sign up / sign in, plus continue-watching and favourites tied to the account.
- Signed-out visitors can still browse and search; saving requires an account.

**Look and feel**
- Mobile-first, dark cinematic theme with poster-led layout, smooth row scrolling and tap feedback.
- I'll show you a few design directions to pick from before building the screens.

## What I need from you

A free movie-database API key (TMDB) so the catalogue is real. I'll ask for it securely when we start. Without it I'll build against a small built-in sample set and swap in live data once the key is in.

## Technical notes

- Lovable Cloud enabled for auth and data: `profiles`, `watchlist`, `continue_watching` tables with row-level security scoped to `auth.uid()`, plus grants for `authenticated`.
- TMDB calls proxied through server functions (`src/lib/movies.functions.ts`) so the API key never reaches the browser; responses cached via TanStack Query.
- Routes: `/` home, `/search`, `/downloads`, `/movie/$id`, `/auth`, `/_authenticated/profile`. Bottom nav in a shared layout.
- Offline saving uses IndexedDB (poster images + metadata) behind a small storage module; installable manifest so it can be added to a home screen.
- Trailer playback via the official YouTube embed returned by TMDB.
- Each route gets its own title/description/og tags.
