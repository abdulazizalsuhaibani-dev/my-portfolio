// Contact form endpoint: AWS Lambda behind a Function URL (eu-west-1).
//
// Stores every submission in DynamoDB, then emails it to the site owner via
// SES with the visitor as Reply-To. The table is the record; the email is only
// a notification, so a failed send never loses a message.
//
// Deployed by pasting this file into the Lambda console (Node.js 22.x, handler
// `index.handler`). Both SDK clients ship with the runtime, so there is nothing
// to install or bundle. Setup steps live in README.md next to this file.
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
