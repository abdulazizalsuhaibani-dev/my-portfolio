# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # dev server on http://localhost:5173/
npm run build      # tsc --noEmit, then vite build -> dist/
npm run preview    # serve the production build
npm run typecheck  # TypeScript only
```

**There is no test framework and no linter installed.** `npm run build` is the
only automated gate — it typechecks before building, so a type error fails the
build. TypeScript runs with `strict`, `noUnusedLocals`, `noUnusedParameters`,
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; the last one means
optional props that can receive `undefined` must be declared
`prop?: T | undefined`, not just `prop?: T`.

Verifying UI behaviour requires a browser — there is no headless harness in the
repo.

## Architecture

A single-page static portfolio. Vite + React 18 + TypeScript + Tailwind 3.4.
No router, no backend, no state library.

### Content is centralised, components are empty of copy

**Every user-visible string lives in `src/data/content.ts`.** No component
contains text. When changing wording, edit that file and nothing else.

Its shape matters:

- Locale-invariant data (`links`, `orgs`, `periods`, `tech`, `skillItems`) is
  declared once at the top and referenced from both language objects, so
  English and Arabic cannot drift apart. Do not inline a URL, date or
  technology name into one locale only.
- `en` and `ar` are both typed as `Content`. Adding a field to one language
  makes the build fail until it exists in the other — this is intentional.

### Theme and locale are initialised in two places

An inline script in `index.html` reads `localStorage` and stamps `.dark` on
`<html>` plus `lang`/`dir` **before React mounts**, to avoid a flash of the
wrong theme or text direction. `ThemeProvider` and `LocaleProvider` then read
the same storage keys (`portfolio-theme`, `portfolio-locale`) and take over.

**If you change a storage key, a class name or the default, change it in both
places** or the page will flash and then correct itself.

`ThemeProvider` follows the OS colour scheme only while no explicit choice is
stored — checking `localStorage` inside the `matchMedia` listener is what makes
that work.

### Design tokens are CSS variables, consumed through Tailwind

`src/index.css` defines the palette under `:root` and `.dark` as
**space-separated RGB channels** (`--primary: 29 78 216`), not hex.
`tailwind.config.js` maps them with `rgb(var(--primary) / <alpha-value>)`, which
is what makes `bg-primary/10` and `text-ink/70` work.

Adding a colour means adding it in both files, in that format. Use the token
classes (`bg-surface`, `text-ink`, `border-rule`, `text-ink-muted`) rather than
raw Tailwind palette colours, so both themes stay in sync automatically. Reds
for form errors are the deliberate exception.

### RTL is structural, not a stylesheet override

Arabic flips `dir="rtl"` on `<html>`, and the layout mirrors because the CSS
uses **logical properties only**: `ms-*`, `me-*`, `ps-*`, `pe-*`, `border-s`,
`rounded-e-*`, `text-start`. Symmetric utilities (`px-*`, `mx-auto`) are fine.

**Never introduce `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*` or
`text-left`/`text-right`** — they will not mirror. The nav rail's tree line is a
logical inline-start border rather than box-drawing characters for this reason.

Conversely, content that must stay left-to-right in both locales carries an
explicit `dir="ltr"`: technology chips, dates, email, phone, shell prompts, key
hints. Keep that when adding similar content.

**Put `dir="ltr"` on the leaf element, never on its list container.** `dir` on a
container also controls flow and alignment, so a `dir="ltr"` chip list inside an
Arabic page renders hard against the left margin while the text around it is
right-aligned. `Chip` carries the `dir`; `ChipList` does not. Same rule for any
new group of Latin-script items.

### Section numbering is duplicated — keep it in sync

`SECTION_IDS` in `content.ts` defines section order, and `Nav` derives the
displayed number from `SECTION_IDS.indexOf(id)`. But each section component
passes a **hardcoded** `index` prop (`<Section id="skills" index="06" …>`).

Reordering or inserting a section means updating `SECTION_IDS` *and* the
hardcoded `index` on every affected section component, or the rail and the
headings will disagree.

Note also that `<Hero>` uses `id="top"`, not `id="profile"` — the `profile`
section is the separate prose block below it.

### Nav is split by breakpoint on purpose

`NavRail` (desktop, `lg:flex`) must be rendered as a direct flex sibling of
`<main>`; `NavBar` (mobile, `lg:hidden`) must be rendered full-bleed *outside*
that flex row. They were originally one component returning a fragment, which
made the mobile bar a flex child and rendered it as a narrow column beside the
content. Do not recombine them.

### Command palette is an optional layer

`CommandPalette` (⌘K / Ctrl K) exists as a convenience only. **Every command it
offers must also have a visible control on the page** — the design explicitly
rejects the terminal-portfolio pattern where navigation is hidden behind typed
commands. If you add a palette command, add or confirm its on-page equivalent.

Its fuzzy matcher is hand-rolled in `src/lib/fuzzy.ts` (subsequence match with
contiguity and word-boundary bonuses) rather than a dependency.

## Deliberate constraints

Several things look unfinished but are decisions:

- **The contact form's credentials come from the environment, and a fresh clone
  has none.** `CONTACT_ENDPOINT` and `CONTACT_ACCESS_KEY` in `src/config.ts`
  read `VITE_*` variables from `.env` (gitignored; `.env.example` is the
  committed template). While the endpoint is empty the form still renders and
  validates, but submitting reports "not configured" instead of faking success,
  so no message is silently lost — keep that path working.

  The transport is an AWS Lambda Function URL in eu-west-1 whose code lives in
  [`infra/contact/`](infra/contact/README.md). It stores each message in
  DynamoDB (`abdulaziz-alsuhaibani-myportfolio-contact-messages`) and then
  emails it via SES with the visitor as `Reply-To`. The table is the record and
  the email only a notification: a failed send is logged, still answers
  `success: true`, and loses nothing. That README lists every resource and why
  it is configured the way it is.

  The function's **code** is deployed by the pipeline: `buildspec.yml` zips
  `infra/contact/index.mjs` and runs `aws lambda update-function-code` before
  uploading the site, so the repo is its source of truth and console edits are
  overwritten on the next push to `main`. Its configuration (environment
  variables, Function URL, CORS) is console-only. The CodeBuild role's inline
  policy `abdulaziz-alsuhaibani-myportfolio-lambda-deploy`
  ([`deploy-policy.json`](infra/contact/deploy-policy.json)) allows updating
  that one function only. The file is plain ESM JavaScript, outside
  `tsconfig`'s `include`, so `tsc` never sees it; `node --check` in both
  `buildspec.yml` and `ci.yml` is its only automated check. It imports only the
  AWS SDK clients the Node.js runtime ships, and must stay a single file.
  It must not set CORS headers: the Function URL adds them, and duplicates
  make browsers reject the response.

  `access_key` is merged into the body only when non-empty. The Lambda needs
  none, so it is unset; the mechanism stays so that switching to a hosted form
  service such as Web3Forms is a config change rather than a code change. Such
  a key **cannot be hidden from visitors**, because Vite inlines it into the
  bundle. So do not add anything to the payload that genuinely needs
  protecting.
  `CONTACT_SUBJECT` lives in `config.ts` rather than `content.ts` on purpose: it
  is never rendered and lands in the owner's inbox, so the visitor's locale must
  not choose its language. The Lambda uses it as the email subject prefix.

  Success is decided by the response body (`success === true`), not the HTTP
  status — a submission rejected as spam still returns a readable response, and
  trusting the status alone would report it as sent.
- **The Arabic copy was drafted, not authored by the site owner** — especially
  organisation names, which may have official Arabic forms. Flag rather than
  silently rewrite.
- **No runtime dependencies beyond `react` and `react-dom`.** i18n, theming,
  fuzzy matching and the clipboard helper are all owned in-repo. Prefer adding
  a small module over a package. That includes icons: `src/components/icons/`
  holds inlined path data from Simple Icons (CC0) and Devicon (MIT) rather than
  an icon package. Brand marks there are set to `currentColor` so they take the
  surrounding token — Simple Icons no longer ships the AWS or LinkedIn marks,
  so those two come from Devicon.

  Organisation logos work differently: they live as files in `public/logos/`
  and are rendered as a **CSS mask over `bg-primary`**, not as `<img>`. That is
  what tints them with the token in both themes, and it keeps the 100 kB Qassim
  file out of the JS bundle.

  **A masked logo must be transparent — only its alpha channel is read.** An
  opaque JPEG or PNG renders as a solid rectangle. Colour, though, is
  irrelevant: a transparent multi-colour or gradient SVG masks perfectly well,
  which is why the SDA logo's 187 gradients were flattened to solid black (58%
  of that file, for no visual effect).

  Transparent vendor SVGs are dropped in as-is; opaque artwork goes through
  `scripts/logo-to-mask.ps1`, which turns ink coverage into alpha, trims the
  margins and writes a PNG. Sources live in `assets/logo-sources/` —
  deliberately outside `public/`, which ships verbatim — and the converted
  files are committed, so the script is asset prep rather than part of the
  build. It uses .NET `System.Drawing` and is Windows-only; that is fine
  precisely because its outputs are committed.

  A full logo lockup is unreadable at the ~44px these render at, so prefer an
  organisation's **icon asset** over its wordmark where one exists — Qassim
  publishes one, and it replaced a hand-cropped SVG that clipped the emblem and
  left glyph fragments behind. Smart Methods has no icon asset, so it is cropped
  via the script's `-Crop`.

  `OrgMark` in `content.ts` is a discriminated union — its `monogram` variant is
  currently unused and exists as the fallback for an organisation whose artwork
  cannot be sourced.
- **Deployment is AWS: S3 + CloudFront, built by CodePipeline/CodeBuild,
  DNS in Route 53 — not GitHub Actions and no longer Cloudflare.**
  `vite.config.ts` sets `base: '/'` — for dev as well as build, deliberately,
  so the dev server and production agree and a path that ignores the base
  fails immediately rather than only once deployed.

  All of it lives in AWS account `502377191133`:

  | Piece | Resource |
  |---|---|
  | Pipeline (eu-west-1) | CodePipeline `abdulaziz-alsuhaibani-myportfolio-pipeline`: GitHub source → CodeBuild `abdulaziz-alsuhaibani-myportfolio-build` |
  | Origin (eu-west-1) | S3 static-website bucket `abdulaziz-alsuhaibani-myportfolio-website` |
  | CDN | CloudFront `E1C5938ABA94M6` (`d12ufvxal5remr.cloudfront.net`), aliases apex + `www`, `redirect-to-https`, WAF attached |
  | TLS | ACM cert in **us-east-1** (CloudFront requires that region) for apex + `www`, DNS-validated |
  | DNS | Route 53 hosted zone `Z09761131CZHHLAX934ZP`; apex and `www` are A/AAAA **alias** records to CloudFront |
  | Registrar | Route 53 Domains (transferred from Cloudflare Registrar 2026-10-05), transfer lock + auto-renew on |

  On push to `main`, the pipeline runs [`buildspec.yml`](buildspec.yml), which
  builds, deploys the contact Lambda's code, and then uploads `dist/` itself —
  there is no separate deploy stage,
  so hashed `assets/` can get a one-year immutable `Cache-Control` while
  `index.html` gets `max-age=0,must-revalidate`. Assets are synced *before*
  `index.html` so a new page never references files that aren't there yet,
  and `post_build` exits early on a failed build so a broken `dist/` is never
  uploaded. It then invalidates `DISTRIBUTION_ID`; the CodeBuild role's
  inline policy `abdulaziz-alsuhaibani-myportfolio-cloudfront-invalidate`
  allows `cloudfront:CreateInvalidation` on that one distribution only, so
  changing the ID means changing the policy too. `ci.yml` still runs
  `npm run build` and `node --check` on the Lambda on pull requests and pushes
  to other branches as a plain check; it does not deploy.

  The contact form's `VITE_CONTACT_ENDPOINT` (the Function URL) comes from SSM
  Parameter Store (`/my-portfolio/VITE_CONTACT_ENDPOINT`), pulled in by
  `buildspec.yml`'s `parameter-store` block — CodeBuild is what runs
  `vite build`, so that's where Vite reads `VITE_*` from. **A parameter listed
  there that doesn't exist fails the build**; remove the line rather than
  leaving it pointing at nothing. Without it the contact form reports "not
  configured" on submit.

  **Do not delete the two `_…acm-validations.aws` CNAMEs in Route 53** — ACM
  re-checks them to auto-renew the certificate. The apex must stay an alias
  record; a CNAME is not allowed at the zone apex.

  No SPA 404 fallback (there is no router). Domain and DNS changes are AWS
  console/CLI steps, not repo changes — no `CNAME` file in `public/`.
- **`tsconfig.json` is a single project with no references.** An earlier
  `tsc -b` + `tsconfig.node.json` setup failed with TS6310 (referenced projects
  may not disable emit). Do not reintroduce project references without also
  solving that.

## Source of truth for content

`src/data/content.ts` is the authoritative copy of the CV text. The PDF served
from `public/Abdulaziz_Alsuhaibani_FullStackDeveloper.pdf` uses a custom subset
font encoding that naive extractors read as garbage, so do not re-parse it —
edit `content.ts` and keep the PDF in step by hand.
