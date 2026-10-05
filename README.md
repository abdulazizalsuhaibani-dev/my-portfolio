# Portfolio — Abdulaziz Alsuhaibani

Personal portfolio for a Full-Stack Developer, built as a developer console:
monospace chrome, blue-and-white palette, light and dark themes, and full
English / Arabic support with RTL mirroring.

Single page, no backend, static output.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173/
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck, then build static output to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript only, no build |

## Editing your content

**All copy lives in [`src/data/content.ts`](src/data/content.ts).** No component
contains text, so updating your CV never means touching a component.

The file is split into two parts:

- **Locale-invariant data** at the top — `links`, `orgs`, `periods`, `tech`,
  `skillItems`. Declared once and referenced from both languages so English
  and Arabic can never drift apart.
- **`en` and `ar` objects** holding all prose. Both are typed as `Content`, so
  if you add a field to one language TypeScript will require it in the other.

A few notes:

- **Language proficiency levels are intentionally blank.** Your CV lists English
  and Arabic without levels, so none were invented. Add a `level` to either
  entry in `content.ts` and it will render automatically.
- **The Arabic translation was drafted for you and should be reviewed** —
  particularly organisation names, which may have official Arabic forms you
  prefer.

## Enabling the contact form

The form is fully built and validates input, but **ships with no endpoint**.
Submitting reports "not configured" rather than pretending to send, so no
message is ever silently lost.

It posts to [Web3Forms](https://web3forms.com), which needs no account — enter
your email on their site and a key is sent to you. Then:

```bash
cp .env.example .env   # then paste the key into VITE_CONTACT_ACCESS_KEY
```

Restart the dev server afterwards; Vite reads env files only at startup. For the
deployed site the same two values come from AWS Systems Manager Parameter Store
instead — see [Deployment](#deployment).

Messages arrive with the sender's address as `Reply-To`, so replying in your
mail client reaches them rather than you.

**The access key cannot be hidden from visitors.** A static site has nothing to
hide it behind, so Vite inlines it into the JS bundle whatever you do. Storing
it in `.env` (gitignored) and in Parameter Store keeps it out of the
repository and out of build logs, where scraping bots look — but not out of
devtools. The worst case is someone burning the monthly quota on mail addressed
to you.

Spam protection is a hidden `botcheck` honeypot plus Web3Forms' own filtering.
Their docs consider the honeypot weak on its own and suggest hCaptcha; that is
worth adding only if spam actually starts arriving.

To move to a self-hosted endpoint later, point `VITE_CONTACT_ENDPOINT` at it and
leave `VITE_CONTACT_ACCESS_KEY` empty — the key is only sent when set, and no
component changes.

## Features

- **⌘K / Ctrl K command palette** — jump to any section, toggle theme or
  language, download the CV, copy the email, open GitHub/LinkedIn. It is a
  convenience layer only: every command has an equivalent control on the page,
  so nothing is hidden behind it.
- **Theme and language persist** to `localStorage`, and an inline script in
  `index.html` applies both before React mounts so there is no flash.
- **Reduced motion** is respected globally — animation and smooth scrolling
  switch off for anyone whose OS asks for it.

## Structure

```
src/
  config.ts             contact endpoint + CV path
  data/content.ts       all content, EN + AR
  i18n/                 locale context, sets <html lang/dir>
  theme/                light/dark context
  hooks/                scroll-spy, reveal, media query, clipboard
  lib/                  fuzzy matcher, platform check
  components/
    sections/           the eight page sections
    ...                 rail, palette, cards, timeline, primitives
```

## Design tokens

The palette is defined once as CSS custom properties in `src/index.css`
(`:root` for light, `.dark` for dark) and surfaced to Tailwind in
`tailwind.config.js`. Change a colour there and it propagates everywhere.

## Deployment

Pushing to `main` builds and publishes to
**[abdulazizalsuhaibani.com](https://abdulazizalsuhaibani.com)** on AWS, not
via GitHub Actions. `.github/workflows/ci.yml` still runs `npm run build` on
pull requests and other branches as a check, but nothing in `.github/`
deploys.

```
GitHub push → CodePipeline → CodeBuild (buildspec.yml) → S3 → CloudFront ← Route 53
```

- **CodePipeline** `abdulaziz-alsuhaibani-myportfolio-pipeline` (eu-west-1)
  picks up the push and runs the CodeBuild project
  `abdulaziz-alsuhaibani-myportfolio-build`.
- **[`buildspec.yml`](buildspec.yml)** runs `npm run build`, uploads `dist/`
  to the S3 bucket `abdulaziz-alsuhaibani-myportfolio-website` (hashed
  `assets/` cached for a year, `index.html` always revalidated), then
  invalidates the CloudFront cache.
- **CloudFront** serves `abdulazizalsuhaibani.com` and `www` over HTTPS with
  an ACM certificate; **Route 53** hosts the DNS and is also the registrar.

The contact form's values are read at build time from Parameter Store:

| Parameter | Type | Value |
| --- | --- | --- |
| `/my-portfolio/VITE_CONTACT_ENDPOINT` | String | `https://api.web3forms.com/submit` |
| `/my-portfolio/VITE_CONTACT_ACCESS_KEY` | SecureString | your Web3Forms key |

Both are optional, but `buildspec.yml` references them — if you don't create
them, remove the `parameter-store` block, or the build fails. Without them the
contact form reports "not configured" on submit.
