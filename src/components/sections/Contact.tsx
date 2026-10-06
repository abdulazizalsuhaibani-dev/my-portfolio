import { useState, type FormEvent, type ReactNode } from 'react';
import { CONTACT_ACCESS_KEY, CONTACT_ENDPOINT, CONTACT_SUBJECT } from '../../config';
import { links } from '../../data/content';
import { useLocale } from '../../i18n/LocaleProvider';
import { Section } from '../Section';
import { GithubIcon, LinkedinIcon, MailIcon, PhoneIcon } from '../icons';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'not-configured';

interface Fields {
  name: string;
  email: string;
  message: string;
}

const EMPTY: Fields = { name: '', email: '', message: '' };

// Deliberately permissive: the server is the real validator, this only
// catches obvious typos before someone loses a message to a bad address.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contact() {
  const { t } = useLocale();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  // Honeypot. Kept out of `Fields` so it can never reach `validate()` and
  // surface an error message to a real person.
  const [botcheck, setBotcheck] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  function validate(values: Fields) {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!values.name.trim()) next.name = t.contact.validation.name;
    if (!values.email.trim()) next.email = t.contact.validation.email;
    else if (!EMAIL_PATTERN.test(values.email.trim()))
      next.email = t.contact.validation.emailInvalid;
    if (!values.message.trim()) next.message = t.contact.validation.message;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // No endpoint yet: say so plainly rather than faking a successful send.
    if (!CONTACT_ENDPOINT) {
      setStatus('not-configured');
      return;
    }

    setStatus('submitting');
    try {
      // The endpoint uses `email` as the Reply-To address, so replying in a mail
      // client reaches the sender rather than yourself. `access_key` is only
      // for a hosted form service and is omitted when unset.
      const body: Record<string, unknown> = {
        ...fields,
        subject: CONTACT_SUBJECT,
        botcheck,
      };
      if (CONTACT_ACCESS_KEY) body.access_key = CONTACT_ACCESS_KEY;

      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });

      // A rejected submission can still arrive as a readable response, so the
      // payload decides — trusting the status alone would report spam as sent.
      const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
      if (!response.ok || result?.success !== true) {
        throw new Error(`Request failed: ${response.status}`);
      }

      setStatus('success');
      setFields(EMPTY);
    } catch {
      setStatus('error');
    }
  }

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (status !== 'idle') setStatus('idle');
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <Section
      id="contact"
      index="08"
      title={t.sections.contact.title}
    >
      <p className="mb-8 max-w-2xl text-base leading-relaxed text-ink-muted">{t.contact.intro}</p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            id="contact-name"
            label={t.contact.nameLabel}
            placeholder={t.contact.namePlaceholder}
            value={fields.name}
            error={errors.name}
            onChange={(value) => update('name', value)}
            autoComplete="name"
          />

          <Field
            id="contact-email"
            label={t.contact.emailLabel}
            placeholder={t.contact.emailPlaceholder}
            value={fields.email}
            error={errors.email}
            onChange={(value) => update('email', value)}
            type="email"
            autoComplete="email"
            dir="ltr"
          />

          <Field
            id="contact-message"
            label={t.contact.messageLabel}
            placeholder={t.contact.messagePlaceholder}
            value={fields.message}
            error={errors.message}
            onChange={(value) => update('message', value)}
            multiline
          />

          {/* Honeypot: hidden from people and from assistive tech, so anything
              that ticks it is a bot and the endpoint drops the submission. Being
              display:none it takes part in no layout, RTL included. */}
          <input
            type="checkbox"
            name="botcheck"
            checked={botcheck}
            onChange={(event) => setBotcheck(event.target.checked)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-mono text-sm text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden="true">[</span>
              {status === 'submitting' ? t.contact.submitting : t.contact.submit}
              <span aria-hidden="true">]</span>
            </button>
          </div>

          {/* One live region so a screen reader announces whichever state lands. */}
          <p aria-live="polite" className="min-h-[1.25rem] text-sm">
            {status === 'success' && <span className="text-primary">{t.contact.success}</span>}
            {status === 'error' && <span className="text-red-600 dark:text-red-400">{t.contact.error}</span>}
            {status === 'not-configured' && (
              <span className="text-ink-muted">{t.contact.notConfigured}</span>
            )}
          </p>
        </form>

        <aside className="rounded-xl border border-rule bg-surface-alt/50 p-5">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">
            {t.contact.directIntro}
          </h3>

          {/* Each row flows with the locale, so the icon lands at the
              inline-start; dir="ltr" sits on the Latin value alone. Putting it
              on the row would pin the whole line to the left in Arabic. */}
          <ul className="space-y-3 font-mono text-sm">
            <li>
              <ContactLink href={`mailto:${links.email}`} icon={<MailIcon />}>
                {links.email}
              </ContactLink>
            </li>
            <li>
              <ContactLink href={`tel:${links.phone}`} icon={<PhoneIcon />}>
                {links.phoneDisplay}
              </ContactLink>
            </li>
            <li>
              <ContactLink href={links.github} icon={<GithubIcon />} external>
                github/{links.githubHandle}
              </ContactLink>
            </li>
            <li>
              <ContactLink href={links.linkedin} icon={<LinkedinIcon />} external>
                linkedin/{links.linkedinHandle}
              </ContactLink>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => void copy(links.email)}
            className="mt-5 w-full rounded-md border border-rule px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-primary hover:text-primary"
          >
            {copied ? t.contact.copied : t.contact.copyEmail}
          </button>
        </aside>
      </div>
    </Section>
  );
}

function ContactLink({
  href,
  icon,
  external = false,
  children,
}: {
  href: string;
  icon: ReactNode;
  external?: boolean;
  children: ReactNode;
}) {
  const externalProps = external ? { target: '_blank', rel: 'noreferrer noopener' } : {};

  return (
    <a
      href={href}
      {...externalProps}
      className="group flex items-center gap-2.5 text-ink transition-colors hover:text-primary"
    >
      <span className="shrink-0 text-ink-muted transition-colors group-hover:text-primary">
        {icon}
      </span>
      <span dir="ltr" className="truncate">
        {children}
      </span>
    </a>
  );
}

interface FieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  multiline?: boolean;
  dir?: 'ltr' | 'rtl';
}

function Field({
  id,
  label,
  placeholder,
  value,
  error,
  onChange,
  type = 'text',
  autoComplete,
  multiline = false,
  dir,
}: FieldProps) {
  const errorId = `${id}-error`;
  const shared = `w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:border-primary ${
    error ? 'border-red-500' : 'border-rule'
  }`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ink-muted">
        {label}
      </label>

      {multiline ? (
        <textarea
          id={id}
          rows={5}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${shared} resize-y`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          dir={dir}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={shared}
        />
      )}

      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
