// Contact form endpoint: AWS Lambda behind a Function URL (eu-west-1).
//
// Stores every submission in DynamoDB, then emails it to the site owner via
// SES with the visitor as Reply-To. The table is the record; the email is only
// a notification, so a failed send never loses a message.
//
// Deployed by buildspec.yml on push to main (Node.js 22.x, handler
// `index.handler`). Both SDK clients ship with the runtime, so there is nothing
// to install or bundle, and it must stay a single file: only this one is
// zipped. Setup steps live in README.md next to this file.
//
// Response contract, relied on by src/components/sections/Contact.tsx: the
// body is always JSON and `success === true` means the message was accepted.
//
// CORS is configured on the Function URL itself. Do not add CORS headers here:
// the URL adds them, and duplicated headers make browsers reject the response.

import { randomUUID } from 'node:crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const { TABLE_NAME, TO_ADDRESS, FROM_ADDRESS } = process.env;

const dynamo = new DynamoDBClient({});
const ses = new SESv2Client({});

const MAX_BODY_BYTES = 16 * 1024;
const LIMITS = { name: 200, email: 254, message: 5000, subject: 200 };
const DEFAULT_SUBJECT = 'Portfolio contact form';

const SITE_URL = 'https://abdulazizalsuhaibani.com';
// The owner reads these in Saudi Arabia; the stored record stays in UTC.
const RECEIVED_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Riyadh',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Stricter than the browser's check: the address goes into a Reply-To header,
// so anything that could split or extend an address list is refused.
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

export async function handler(event) {
  const method = event.requestContext?.http?.method;
  if (method === 'OPTIONS') return { statusCode: 204 };
  if (method !== 'POST') return reply(405, { success: false, error: 'Method not allowed' });

  if (!TABLE_NAME || !TO_ADDRESS || !FROM_ADDRESS) {
    console.error('Missing TABLE_NAME, TO_ADDRESS or FROM_ADDRESS environment variable');
    return reply(500, { success: false, error: 'Not configured' });
  }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '');
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return reply(413, { success: false, error: 'Payload too large' });
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return reply(400, { success: false, error: 'Invalid JSON' });
  }
  if (typeof input !== 'object' || input === null) {
    return reply(400, { success: false, error: 'Invalid body' });
  }

  // Honeypot ticked: a bot. Report success so it learns nothing, store nothing.
  if (input.botcheck) {
    console.info('Dropped submission: honeypot ticked');
    return reply(200, { success: true });
  }

  const name = singleLine(input.name);
  const email = text(input.email);
  const message = text(input.message);
  const subject = singleLine(input.subject) || DEFAULT_SUBJECT;

  if (
    !name || name.length > LIMITS.name ||
    !email || email.length > LIMITS.email || !EMAIL_PATTERN.test(email) ||
    !message || message.length > LIMITS.message ||
    subject.length > LIMITS.subject
  ) {
    return reply(400, { success: false, error: 'Invalid fields' });
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const sourceIp = event.requestContext?.http?.sourceIp ?? '';
  const userAgent = (event.requestContext?.http?.userAgent ?? '').slice(0, 512);
  const origin = (event.headers?.origin ?? '').slice(0, 256);

  try {
    await dynamo.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          id: { S: id },
          createdAt: { S: createdAt },
          name: { S: name },
          email: { S: email },
          message: { S: message },
          sourceIp: { S: sourceIp },
          userAgent: { S: userAgent },
          origin: { S: origin },
        },
      }),
    );
  } catch (error) {
    // Nothing was kept, so the visitor must be told to try again.
    console.error('DynamoDB PutItem failed', error);
    return reply(500, { success: false, error: 'Could not save message' });
  }

  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: FROM_ADDRESS,
        Destination: { ToAddresses: [TO_ADDRESS] },
        ReplyToAddresses: [email],
        Content: {
          Simple: {
            Subject: { Data: `${subject}: ${name}`, Charset: 'UTF-8' },
            Body: {
              Text: {
                Data: [
                  `From: ${name} <${email}>`,
                  `Received: ${createdAt}`,
                  `IP: ${sourceIp}`,
                  `ID: ${id}`,
                  '',
                  message,
                ].join('\n'),
                Charset: 'UTF-8',
              },
              Html: {
                Data: renderHtml({ id, name, email, message, subject, createdAt, sourceIp }),
                Charset: 'UTF-8',
              },
            },
          },
        },
      }),
    );
  } catch (error) {
    // The message is already in the table, so it is not lost: still report
    // success, and leave a log line to find it by.
    console.error(`SES SendEmail failed for message ${id}`, error);
  }

  return reply(200, { success: true });
}

function reply(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// For values that end up in a header (name and subject go into Subject).
function singleLine(value) {
  return text(value).replace(/[\r\n]+/g, ' ');
}

// ---------------------------------------------------------------------------
// HTML notification
//
// Mirrors the site's design: the `$` prompt, the "── 08 CONTACT ───" section
// rule, mono chrome over a sans body, and the palette from src/index.css
// written out as hex, because mail clients understand neither CSS variables nor
// Tailwind. Tables and inline styles are what mail clients reliably render;
// the <style> block only adds dark mode where a client supports it (Apple Mail,
// Outlook on macOS/iOS). Gmail ignores it and applies its own dark mode, and
// skips the web fonts, falling back to the system stacks below.
//
// Every visitor-supplied value goes through escapeHtml() — this is the one
// place their text becomes markup.
// ---------------------------------------------------------------------------

const LIGHT = {
  surface: '#FFFFFF',
  surfaceAlt: '#F5F8FF',
  primary: '#1D4ED8',
  ink: '#0B1F3A',
  inkMuted: '#4A5B7C',
  rule: '#DBE4F5',
};

const DARK = {
  surface: '#0A0F1A',
  surfaceAlt: '#111827',
  primary: '#60A5FA',
  ink: '#E5EDFF',
  inkMuted: '#94A3C4',
  rule: '#1E2A44',
};

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS =
  "Inter, 'IBM Plex Sans Arabic', -apple-system, 'Segoe UI', Helvetica, Arial, Tahoma, sans-serif";

function renderHtml({ id, name, email, message, subject, createdAt, sourceIp }) {
  const c = LIGHT;
  const received = `${RECEIVED_FORMAT.format(new Date(createdAt))} Riyadh`;
  const replyHref = `mailto:${encodeAddress(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`;
  const preheader = message.replace(/\s+/g, ' ').slice(0, 140);
  const body = escapeHtml(message).replace(/\r?\n/g, '<br>');

  const label = (text) =>
    `<td class="muted" style="width:92px;padding:6px 0;vertical-align:top;font-family:${MONO};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${c.inkMuted};">${text}</td>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  @media (prefers-color-scheme: dark) {
    .page { background: ${DARK.surface} !important; }
    .card { background: ${DARK.surfaceAlt} !important; border-color: ${DARK.rule} !important; }
    .well { background: ${DARK.surface} !important; border-color: ${DARK.rule} !important; border-left-color: ${DARK.primary} !important; }
    .ink { color: ${DARK.ink} !important; }
    .muted { color: ${DARK.inkMuted} !important; }
    .primary { color: ${DARK.primary} !important; }
    .rule { border-top-color: ${DARK.rule} !important; }
    .caret { background: ${DARK.primary} !important; }
    .button { background: ${DARK.primary} !important; color: ${DARK.surface} !important; }
  }
</style>
</head>
<body class="page" style="margin:0;padding:0;background:${c.surfaceAlt};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" class="page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.surfaceAlt};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr>
          <td dir="ltr" style="padding:0 4px 12px;font-family:${MONO};font-size:13px;">
            <span class="primary" style="color:${c.primary};">$</span>&nbsp;<span class="muted" style="color:${c.inkMuted};">mail --from portfolio</span>&nbsp;<span class="caret" style="display:inline-block;width:7px;height:14px;vertical-align:middle;background:${c.primary};"></span>
          </td>
        </tr>
        <tr>
          <td class="card" style="background:${c.surface};border:1px solid ${c.rule};border-radius:12px;padding:28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="primary" style="padding-right:10px;white-space:nowrap;font-family:${MONO};font-size:13px;color:${c.primary};">──&nbsp;08</td>
                <td class="ink" style="padding-right:12px;white-space:nowrap;font-family:${MONO};font-size:16px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${c.ink};">Contact</td>
                <td width="100%" style="vertical-align:middle;"><div class="rule" style="border-top:1px solid ${c.rule};height:0;line-height:0;font-size:0;">&nbsp;</div></td>
              </tr>
            </table>

            <p class="muted" style="margin:16px 0 20px;font-family:${SANS};font-size:15px;line-height:1.6;color:${c.inkMuted};">A new message arrived through the contact form.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${label('Name')}
                <td class="ink" style="padding:6px 0;font-family:${SANS};font-size:15px;font-weight:600;color:${c.ink};"><span dir="auto">${escapeHtml(name)}</span></td>
              </tr>
              <tr>
                ${label('Email')}
                <td dir="ltr" style="padding:6px 0;font-family:${MONO};font-size:14px;"><a class="primary" href="${escapeHtml(replyHref)}" style="color:${c.primary};text-decoration:none;">${escapeHtml(email)}</a></td>
              </tr>
              <tr>
                ${label('Received')}
                <td dir="ltr" class="ink" style="padding:6px 0;font-family:${MONO};font-size:14px;color:${c.ink};">${escapeHtml(received)}</td>
              </tr>
            </table>

            <div class="muted" style="margin:24px 0 8px;font-family:${MONO};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${c.inkMuted};">Message</div>
            <div dir="auto" class="well ink" style="background:${c.surfaceAlt};border:1px solid ${c.rule};border-left:3px solid ${c.primary};border-radius:8px;padding:16px 18px;font-family:${SANS};font-size:15px;line-height:1.7;color:${c.ink};word-wrap:break-word;">${body}</div>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
              <tr>
                <td><a class="button" href="${escapeHtml(replyHref)}" style="display:inline-block;background:${c.primary};color:${c.surface};border-radius:6px;padding:10px 18px;font-family:${MONO};font-size:13px;text-decoration:none;">Reply&nbsp;→</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td dir="ltr" class="muted" style="padding:16px 4px 0;font-family:${MONO};font-size:11px;line-height:1.7;color:${c.inkMuted};">
            id ${escapeHtml(id)} · ip ${escapeHtml(sourceIp || 'unknown')}<br>
            Sent by the contact form on <a class="primary" href="${SITE_URL}" style="color:${c.primary};text-decoration:none;">${SITE_URL.replace('https://', '')}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Percent-encodes each side of the address, so characters EMAIL_PATTERN still
// allows (`?`, `&`, `=`) cannot add headers such as `cc=` to the mailto: link.
function encodeAddress(address) {
  const at = address.lastIndexOf('@');
  return `${encodeURIComponent(address.slice(0, at))}@${encodeURIComponent(address.slice(at + 1))}`;
}
