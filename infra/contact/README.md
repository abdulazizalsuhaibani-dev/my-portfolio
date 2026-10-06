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

Everything is in account `502377191133`, region **eu-west-1**. None of it is
deployed by the site pipeline. It is set up once in the console, and the
function code is updated by pasting `index.mjs` into the Lambda editor.

| Piece | Resource |
|---|---|
| SES identities | domain `abdulazizalsuhaibani.com` (Easy DKIM, records in Route 53) and recipient `ama.alsuhibani@gmail.com`; account stays in the SES sandbox |
| DynamoDB | `abdulaziz-alsuhaibani-myportfolio-contact-messages`, partition key `id` (String), on-demand, deletion protection on |
| IAM role | `abdulaziz-alsuhaibani-myportfolio-contact-role`: `AWSLambdaBasicExecutionRole` + inline [`iam-policy.json`](iam-policy.json) |
| Log group | `/aws/lambda/abdulaziz-alsuhaibani-myportfolio-contact`, 1 month retention |
| Lambda | `abdulaziz-alsuhaibani-myportfolio-contact`, Node.js 22.x, arm64, 128 MB, 10 s, reserved concurrency 2 |
| Function URL | auth `NONE`, CORS origins `https://abdulazizalsuhaibani.com` and `https://www.abdulazizalsuhaibani.com`, methods `POST`, headers `content-type`, `accept` |
| Budget | monthly cost alert at $2 |

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
- **Validation is stricter than the browser's.** The address becomes a
  `Reply-To` header, so characters that could extend an address list are
  refused.

## Updating the function

1. Paste `index.mjs` into **Lambda → Code** and click **Deploy**.
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
