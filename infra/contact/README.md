# Contact form endpoint

The contact form POSTs to an AWS Lambda Function URL. The function stores each
message in DynamoDB and emails it to the site owner through SES, with the
visitor's address as `Reply-To`.

```
Browser ──POST──▶ Lambda Function URL ──┬──▶ DynamoDB  (the record)
                                         └──▶ SES email (the notification)
```

The table is the source of truth. If the email fails, the message is still
stored and the function logs `SES SendEmail failed for message <id>`. To read
messages, open **DynamoDB → Tables →
`abdulaziz-alsuhaibani-myportfolio-contact-messages` → Explore table items**.

Everything is in account `502377191133`, region **eu-west-1**, and was set up
once in the console. The one thing the site pipeline deploys is the function
**code**: on push to `main`, `buildspec.yml` zips `index.mjs` and uploads it
before publishing the site. Configuration (environment variables, Function URL,
CORS, role) is not touched by the pipeline.

| Piece | Resource |
|---|---|
| SES identities | domain `abdulazizalsuhaibani.com` (Easy DKIM, records in Route 53) and recipient `ama.alsuhibani@gmail.com`; account stays in the SES sandbox |
| DynamoDB | `abdulaziz-alsuhaibani-myportfolio-contact-messages`, partition key `id` (String), on-demand, deletion protection on |
| IAM role | `abdulaziz-alsuhaibani-myportfolio-contact-role`: `AWSLambdaBasicExecutionRole` + inline [`iam-policy.json`](iam-policy.json) |
| Log group | `/aws/lambda/abdulaziz-alsuhaibani-myportfolio-contact`, 1 month retention |
| Lambda | `abdulaziz-alsuhaibani-myportfolio-contact`, Node.js 22.x, arm64, 128 MB, 10 s, no reserved concurrency (see below) |
| Function URL | auth `NONE`, CORS origins `https://abdulazizalsuhaibani.com` and `https://www.abdulazizalsuhaibani.com`, methods `POST`, headers `content-type`, `accept` |
| Budget | monthly cost alert at $2 |
| Deploy permission | inline policy `abdulaziz-alsuhaibani-myportfolio-lambda-deploy` on the CodeBuild service role: [`deploy-policy.json`](deploy-policy.json), this one function only |

## Environment variables

| Key | Value |
|---|---|
| `TABLE_NAME` | `abdulaziz-alsuhaibani-myportfolio-contact-messages` |
| `TO_ADDRESS` | `ama.alsuhibani@gmail.com` |
| `FROM_ADDRESS` | `Portfolio contact <contact@abdulazizalsuhaibani.com>` |

## Things that look odd but are deliberate

- **The SES permission is `identity/*`, not just the domain.** While the
  account is in the sandbox, SES also checks authorisation against the
  recipient's identity, so naming only the sender fails.
- **The function sets no CORS headers.** The Function URL adds them, and
  duplicated headers make browsers reject the response.
- **A ticked honeypot gets `success: true`** so a bot learns nothing. Nothing
  is stored or sent.
- **There is no reserved concurrency.** The account's Lambda concurrency
  limit in eu-west-1 is 100, and AWS keeps 100 unreserved, so nothing can be
  reserved. Cost is bounded instead by the SES sandbox (200 emails a day), the
  16 kB payload limit and the $2 budget alert. Raising the account limit
  through Service Quotas would allow capping the function at 2.
- **The notification is HTML with a plain-text alternative.** It mirrors the
  site's look (prompt line, `── 08 CONTACT` rule, mono labels), so its palette
  is `src/index.css` written out as hex in `LIGHT`/`DARK`: change a token there
  and change it here. Tables and inline styles are deliberate; mail clients
  ignore CSS variables and most stylesheets. Every visitor value goes through
  `escapeHtml()`, and the `mailto:` address is percent-encoded so a crafted
  address cannot add `cc=` or other headers.
- **Validation is stricter than the browser's.** The address becomes a
  `Reply-To` header, so characters that could extend an address list are
  refused.

## Updating the function

1. Edit `index.mjs` and merge to `main`. The pipeline runs `node --check` on
   it, uploads it with `aws lambda update-function-code` and waits for the
   update to finish before syncing the site; a failure there stops the site
   upload too. `ci.yml` runs the same syntax check on pull requests.

   Do not edit the code in the Lambda console: the next push to `main`
   overwrites it.
2. Test it with:

   ```bash
   curl -X POST '<function-url>' -H 'Content-Type: application/json' \
     -d '{"name":"Test","email":"you@example.com","message":"hello","botcheck":false}'
   ```

   Expect `{"success":true}`, a new row in the table and an email in your inbox.

## Pointing the site at it

The site reads the URL at build time from Parameter Store
`/my-portfolio/VITE_CONTACT_ENDPOINT`, through `buildspec.yml`. Changing the
parameter takes effect on the next pipeline run.
