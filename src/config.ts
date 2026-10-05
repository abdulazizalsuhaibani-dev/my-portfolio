import { asset } from './lib/asset';

/**
 * Endpoint the contact form POSTs to. Currently a Web3Forms submit URL.
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
 * Web3Forms access key, sent as `access_key` in the request body.
 *
 * This is NOT a secret: a static site has nothing to hide it behind, so it
 * ships inside the JS bundle either way. Reading it from the environment keeps
 * it out of the repository, which is where key-scraping bots look — the worst
 * case being someone burning the monthly quota on mail addressed to you.
 *
 * Merged into the body only when non-empty, so moving to a self-hosted endpoint
 * later (an AWS Lambda Function URL, say) means blanking this and changing the
 * URL above. No component changes, and the endpoint never sees a stray field.
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
