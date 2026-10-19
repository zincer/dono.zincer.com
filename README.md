# dono.zincer.com

The landing page for Dono, the notch calendar and day planner for the Mac. Astro, static, deployed to GitHub Pages.

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

The notch demo's colours and timings come from the app (`DonoDesign.swift`, `NotchLayout.swift`, `NotchTimeFormatter.swift`, `RingProgress.swift`, `TimeAccounting.swift`). If they change there, update `src/styles/tokens.css` and `src/scripts/notch/format.ts`.

## Deploy (one-time setup by the owner)

1. The repo is `zincer/dono.zincer.com`: remote `git@github.com-ntnthien:zincer/dono.zincer.com.git` (the ntnthien SSH alias; the default github.com key has no access).
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**. Custom domain: `dono.zincer.com`.
3. DNS for zincer.com: add `CNAME dono → zincer.github.io`.
4. When the certificate is issued, tick **Enforce HTTPS**.

Every push to `main` then runs the tests and deploys.
