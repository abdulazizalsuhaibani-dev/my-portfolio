import { asset } from './lib/asset';

/**
 * Endpoint the contact form POSTs to: an AWS Lambda Function URL that stores
 * the message in DynamoDB and emails it via SES (see infra/contact/).
 *
 * Read from the environment (`.env`, see `.env.example`) so it is absent in a
 * fresh clone. While it is empty the form still renders and validates, but
 * submitting reports "endpoint not configured" rather than pretending to send —
 * a silent no-op would lose real messages.
 */
// Annotated as `string` rather than inferred so filling it in later does not
// change the type and TypeScript never narrows the empty case to unreachable.
export const CONTACT_ENDPOINT: string = import.meta.env.VITE_CONTACT_ENDPOINT ?? '';

/**
 * Access key for a hosted form service such as Web3Forms, sent as `access_key`
 * in the request body. Empty for the Lambda endpoint, which needs none.
 *
 * Kept so switching back to a hosted service stays a config change: it is
 * merged into the body only when non-empty, so the Lambda never sees a stray
 * field. It would NOT be a secret: a static site has nothing to hide it
 * behind, so Vite inlines it into the JS bundle either way.
 */
export const CONTACT_ACCESS_KEY: string = import.meta.env.VITE_CONTACT_ACCESS_KEY ?? '';

/**
 * Subject line of the notification email.
 *
 * Deliberately not in `content.ts`. That rule covers user-visible copy; this
 * string is never rendered and lands in the site owner's inbox, so the
 * visitor's locale should not decide the language of your own mail.
 */
export const CONTACT_SUBJECT = 'Portfolio contact form';

/**
 * Path to the CV served out of /public.
 *
 * Resolved through `asset()` so it keeps working if the site is ever deployed
 * under a base path, where a bare '/…' literal would 404. Wrapping the constant rather than its
 * two consumers (`Hero`, `CommandPalette`) keeps that a single edit.
 */
export const CV_PATH = asset('/Abdulaziz_Alsuhaibani_FullStackDeveloper.pdf');

export const CV_FILENAME = 'Abdulaziz_Alsuhaibani_FullStackDeveloper.pdf';
