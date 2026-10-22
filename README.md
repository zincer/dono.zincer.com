# ake.to

The landing page for Ake, the notch meeting countdown for the Mac. Astro, static, deployed to GitHub Pages. Pages: `/`, `/next` (what's coming, waitlist), `/privacy`, `/support`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:4321 |
| `npm test` | Vitest unit tests (notch formatting, demo timeline, signup) |
| `npm run check` | `astro check` type check |
| `npm run test:e2e` | Builds, serves on 127.0.0.1:4174, runs Playwright |
| `mise run test` | All three in order |
| `node scripts/make-og.mjs` | Regenerates `public/og.png` from `/og/` while `npm run preview` runs |

## Configuration

`src/config.ts`:

- `SIGNUP_ENDPOINT`: empty means the form is disabled and says "Beta signups open soon". Set it to a Formspree-style endpoint (accepts a POSTed `email` field, answers JSON when asked with `Accept: application/json`) to open signups. No other change is needed.
- `CONTACT_EMAIL`: shown in the signup note and the footer.

The notch demo's colours and timings come from the app (`AkeDesign.swift`, `NotchLayout.swift`, `NotchTimeFormatter.swift`, `RingProgress.swift`, `TimeAccounting.swift`). If they change there, update `src/styles/tokens.css` and `src/scripts/notch/format.ts`.

## Deploy (one-time setup by the owner)

1. The repo is `zincer/ake.to`: remote `git@github.com-ntnthien:zincer/ake.to.git` (the ntnthien SSH alias; the default github.com key has no access).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**. Custom domain: `ake.to`.
3. DNS for ake.to (an apex domain, so no CNAME at the root), set **before** pushing — `public/CNAME` says `ake.to`:
   - `A` records for `ake.to`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (or an `ALIAS`/`ANAME` to `zincer.github.io` if the DNS host supports it)
   - optional `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME www → zincer.github.io`
4. When the certificate is issued, tick **Enforce HTTPS**.

Every push to `main` then runs the tests and deploys.
