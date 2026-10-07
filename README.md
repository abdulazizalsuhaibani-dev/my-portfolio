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

It posts to an AWS Lambda Function URL that stores every message in DynamoDB
and emails it to you through SES. The AWS setup, the function code and how to
read stored messages are in [`infra/contact/`](infra/contact/README.md).

For local development, put the Function URL in `.env`:

```bash
cp .env.example .env   # then paste the URL into VITE_CONTACT_ENDPOINT
```

Restart the dev server afterwards; Vite reads env files only at startup. The
Function URL's CORS settings must also allow `http://localhost:5173`. For the
deployed site the URL comes from AWS Systems Manager Parameter Store instead.
See [Deployment](#deployment).

Messages arrive with the sender's address as `Reply-To`, so replying in your
mail client reaches them rather than you. If an email fails to send, the
message is still in the DynamoDB table.

Spam protection is a hidden `botcheck` honeypot. A flood cannot run up much of
a bill: the SES sandbox caps sending at 200 emails a day, the payload is
size-limited, and a $2 monthly budget alert is the backstop.

To switch to a hosted form service such as Web3Forms instead, point
`VITE_CONTACT_ENDPOINT` at it and set `VITE_CONTACT_ACCESS_KEY`. The key is
only sent when set, and no component changes. Such a key cannot be hidden from
visitors: Vite inlines it into the JS bundle.

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
infra/
  contact/              contact form Lambda + its AWS setup (not built by Vite)
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
- **[`buildspec.yml`](buildspec.yml)** runs `npm run build`, deploys the
  contact form's Lambda code from [`infra/contact/`](infra/contact/README.md),
  uploads `dist/` to the S3 bucket `abdulaziz-alsuhaibani-myportfolio-website` (hashed
  `assets/` cached for a year, `index.html` always revalidated), then
  invalidates the CloudFront cache.
- **CloudFront** serves `abdulazizalsuhaibani.com` and `www` over HTTPS with
  an ACM certificate; **Route 53** hosts the DNS and is also the registrar.

The contact form's values are read at build time from Parameter Store:

| Parameter | Type | Value |
| --- | --- | --- |
| `/my-portfolio/VITE_CONTACT_ENDPOINT` | String | the Lambda Function URL |

It is optional, but `buildspec.yml` references it. If you don't create it,
remove the `parameter-store` block, or the build fails. Without them the
contact form reports "not configured" on submit.
