/**
 * Every word on the site lives here.
 *
 * Editing your CV means editing this file and nothing else — no component
 * contains copy. Values that are the same in both languages (URLs, dates,
 * technology names) are declared once above and referenced from both locales
 * so they can never drift apart.
 */

export type Locale = 'en' | 'ar';

export const LOCALES: readonly Locale[] = ['en', 'ar'];

export const SECTION_IDS = [
  'profile',
  'experience',
  'projects',
  'education',
  'certifications',
  'skills',
  'languages',
  'contact',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

// ---------------------------------------------------------------------------
// Locale-invariant data
// ---------------------------------------------------------------------------

export const links = {
  email: 'ama.alsuhibani@gmail.com',
  phone: '+966505611519',
  phoneDisplay: '+966 50 561 1519',
  github: 'https://github.com/abdulazizalsuhaibani-dev',
  githubHandle: 'abdulazizalsuhaibani-dev',
  linkedin: 'https://www.linkedin.com/in/abdulaziz-alsuhaibani-539982239/',
  linkedinHandle: 'abdulaziz-alsuhaibani',
} as const;

/** Company and school names stay in Latin script in both locales. */
const orgs = {
  grenoble: { en: 'Grenoble Partners', ar: 'غرونوبل بارتنرز' },
  smartMethods: { en: 'Smart Methods', ar: 'الأساليب الذكية' },
  sda: { en: 'Saudi Digital Academy x Integrify', ar: 'الأكاديمية السعودية الرقمية مع انتقرفاي' },
  qassim: { en: 'Qassim University', ar: 'جامعة القصيم' },
} as const;

/**
 * Arabic reads the range end-first (e.g. "حتى الآن – 01/2025"), the reverse of
 * the English start-first order — a deliberate choice by the site owner, so
 * each entry needs its own en/ar pair rather than sharing one string.
 *
 * Grenoble's "حتى الآن" is wrapped in RTL isolate marks (U+2067 … U+2069)
 * because inside a dir="ltr" span, the bidi algorithm renders an RTL word
 * next to LTR digits identically regardless of source order — swapping
 * '01/2025 – حتى الآن' to 'حتى الآن – 01/2025' alone is visually a no-op.
 * The isolate forces the browser to honour the written left-to-right order
 * of the two chunks. Verified by measuring rendered glyph positions; do not
 * remove the isolate marks or the reversal silently regresses.
 */
const periods = {
  grenoble: { en: '01/2025 – present', ar: '⁧حتى الآن⁩ – 01/2025' },
  smartMethods: { en: '06/2023 – 08/2023', ar: '08/2023 – 06/2023' },
  sda: { en: '08/2024 – 11/2024', ar: '11/2024 – 08/2024' },
  qassim: { en: '08/2019 – 06/2024', ar: '06/2024 – 08/2019' },
  gameStore: { en: '08/2024 – 12/2024', ar: '12/2024 – 08/2024' },
  captcha: { en: '12/2022 – 06/2023', ar: '06/2023 – 12/2022' },
} as const;

const tech = {
  grenoble: ['React.js', 'FastAPI', 'Python', 'AWS', 'Agentic AI Development', 'C#', 'ASP.NET', 'PostgreSQL', 'REST APIs'],
  smartMethods: ['HTML/CSS', 'JavaScript', 'jQuery', 'Python', 'PHP', 'GitHub'],
  sda: ['JavaScript', 'TypeScript', 'React.js', 'C#', 'ASP.NET Core', 'Npgsql', 'GitHub', 'Material-UI'],
  qassim: ['Software Engineering', 'System Design', 'Computer Networks', 'Data Structures', 'Algorithms', 'OOP', 'Java', 'C/C++', 'Python', 'SQL'],
  gameStore: ['React', 'REST APIs', 'ASP.NET', 'PostgreSQL'],
  captcha: ['Flutter', 'Dart', 'SQLite'],
} as const;

/**
 * Marks shown beside a timeline entry, all rendered as a mask tinted with the
 * primary token — see TimelineItem.
 *
 * Integrify, Qassim University and the Saudi Digital Academy ship transparent
 * SVGs. Grenoble Partners and Smart Methods were supplied as opaque JPEGs and
 * converted to alpha masks by `scripts/logo-to-mask.ps1`; re-run it if the
 * source artwork changes. Every organisation now has real artwork, so the
 * `monogram` variant is unused — it stays as the fallback for the next entry
 * whose logo cannot be sourced.
 */
const marks = {
  grenoble: [{ kind: 'logo', src: '/logos/grenoble-partners.png', shape: 'square' }],
  smartMethods: [{ kind: 'logo', src: '/logos/smart-methods.png', shape: 'square' }],
  // The programme was run by the two organisations jointly, so both appear.
  sda: [
    { kind: 'logo', src: '/logos/sda.svg', shape: 'wide' },
    { kind: 'logo', src: '/logos/integrify.svg', shape: 'wide' },
  ],
  // The university's own icon asset: already the emblem alone, and already
  // transparent, so it needs no cropping or conversion.
  qassim: [{ kind: 'logo', src: '/logos/qassim-university.webp', shape: 'square' }],
} as const;

/** Issuer names are Latin script in both locales, so they live here too. */
const issuers = {
  aws: {
    name: 'Amazon Web Services',
    logo: 'aws',
    credentialUrl: 'https://www.credly.com/badges/16ba8d9d-c6d5-40a3-83ce-f84d87b1eef9',
  },
  w3schools: {
    name: 'W3Schools',
    logo: 'w3schools',
    credentialUrl: 'https://verify.w3schools.com/1PIAXL5RQ2',
  },
} as const;

/** Public repositories behind the projects. Verified public before linking. */
const repos = {
  gameStore: [
    { name: 'game-accessories-store', url: 'https://github.com/abdulazizalsuhaibani-dev/game-accessories-store' },
    { name: 'game-accessories-api', url: 'https://github.com/abdulazizalsuhaibani-dev/game-accessories-api' },
  ],
  captcha: [{ name: 'ArabicLearningGame', url: 'https://github.com/abdulazizalsuhaibani-dev/ArabicLearningGame' }],
} as const;

const skillItems = {
  languages: ['JavaScript', 'TypeScript', 'HTML/CSS', 'Python', 'C#', 'Dart', 'SQL', 'Java', 'C/C++'],
  frontend: ['React.js', 'Vite', 'Tailwind CSS', 'HTML5', 'Material-UI', 'Bootstrap', 'Flutter'],
  backend: ['FastAPI', 'ASP.NET', 'Django', 'PostgreSQL', 'MySQL', 'SQLite', 'REST APIs', 'Microservices', 'WebHooks'],
  cloudTools: ['AWS Cloud', 'Git & GitHub', 'Docker', 'Linux', 'Microsoft Azure', 'Postman', 'Render.com'],
  aiAssisted: ['Claude Code', 'Cursor AI', 'Agentic AI Development'],
  planning: ['Lucidchart', 'Jira', 'Confluence', 'Slack', 'Microsoft Teams', 'Trello', 'Agile Methodologies', 'Scrum'],
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A logo beside a timeline entry. Purely decorative — the organisation is
 * always named in text next to it — so neither variant carries a label.
 */
export type OrgMark =
  | { kind: 'monogram'; label: string }
  /** `shape` sizes the slot: a wordmark needs width, an emblem needs height. */
  | { kind: 'logo'; src: string; shape: 'wide' | 'square' };

export interface TimelineEntry {
  /** Job title or degree. */
  title: string;
  org: string;
  location: string;
  period: string;
  /** Organisation marks; more than one where a programme was run jointly. */
  marks?: readonly OrgMark[];
  bullets: readonly string[];
  tech: readonly string[];
  /** Renders as the active HEAD node on the timeline. */
  current?: boolean;
  /** Optional pulled-out stat, e.g. a GPA. */
  highlight?: { label: string; value: string };
}

export interface Repo {
  /** Shown as the link label, so it stays the real repository name. */
  name: string;
  url: string;
}

export interface Project {
  name: string;
  period: string;
  description: string;
  tech: readonly string[];
  /** Optional headline outcome shown as a badge. */
  outcome?: string;
  /** Public repositories, rendered as source links on the card. */
  repos?: readonly Repo[];
}

export interface Certification {
  name: string;
  issuer: string;
  description: string;
  /** Issuer mark to show instead of the generic award glyph. */
  logo?: 'aws' | 'w3schools';
  /** Public verification page for the credential. */
  url?: string;
}

export interface SkillGroup {
  label: string;
  items: readonly string[];
}

export interface LanguageEntry {
  name: string;
  /** The language written in its own script. */
  endonym: string;
  /**
   * Proficiency label, supplied by the site owner rather than the CV, which
   * lists the languages without levels. Optional so a language can be added
   * without one; the badge only renders when it is set.
   */
  level?: string;
}

export interface Content {
  meta: { title: string; description: string };
  hero: {
    greeting: string;
    name: string;
    role: string;
    location: string;
    tagline: string;
    downloadCv: string;
    contactCta: string;
  };
  nav: Record<SectionId, string>;
  sections: Record<SectionId, { title: string }>;
  profile: { body: string };
  experience: readonly TimelineEntry[];
  projects: readonly Project[];
  education: readonly TimelineEntry[];
  certifications: readonly Certification[];
  skills: readonly SkillGroup[];
  languages: readonly LanguageEntry[];
  contact: {
    intro: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    notConfigured: string;
    validation: { name: string; email: string; emailInvalid: string; message: string };
    directIntro: string;
    copyEmail: string;
    copied: string;
  };
  palette: {
    open: string;
    /** Short form for the narrow rail button, which sits beside a shortcut key. */
    openShort: string;
    placeholder: string;
    empty: string;
    hintNavigate: string;
    hintSelect: string;
    hintClose: string;
    groups: { navigate: string; actions: string; links: string };
    commands: {
      toggleTheme: string;
      toggleThemeLight: string;
      toggleThemeDark: string;
      switchLocale: string;
      downloadCv: string;
      copyEmail: string;
      openGithub: string;
      openLinkedin: string;
      sendEmail: string;
    };
  };
  ui: {
    themeToLight: string;
    themeToDark: string;
    localeSwitch: string;
    skipToContent: string;
    menu: string;
    close: string;
    current: string;
    /** Screen-reader suffix on a repository link, which otherwise reads as a bare slug. */
    sourceOnGithub: string;
    /** Label on a certification's link to its public verification page. */
    verifyCredential: string;
  };
  footer: { builtWith: string; rights: string };
}

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

const en: Content = {
  meta: {
    title: 'Abdulaziz Alsuhaibani — Full-Stack Developer',
    description:
      'Full-Stack Developer in Riyadh, Saudi Arabia. React.js, Python, C#, ASP.NET, PostgreSQL and AWS.',
  },
  hero: {
    greeting: 'whoami',
    name: 'Abdulaziz Alsuhaibani',
    role: 'Full-Stack Developer',
    location: 'Riyadh, Saudi Arabia',
    tagline: 'I build scalable web applications and the APIs that hold them together. Interested in building innovative and impactful projects.',
    downloadCv: 'download CV',
    contactCta: 'get in touch',
  },
  nav: {
    profile: 'profile',
    experience: 'experience',
    projects: 'projects',
    education: 'education',
    certifications: 'certifications',
    skills: 'skills',
    languages: 'languages',
    contact: 'contact',
  },
  sections: {
    profile: { title: 'Profile' },
    experience: { title: 'Experience' },
    projects: { title: 'Projects' },
    education: { title: 'Education' },
    certifications: { title: 'Certifications' },
    skills: { title: 'Skills' },
    languages: { title: 'Languages' },
    contact: { title: 'Contact' },
  },
  profile: {
    body:
      "I'm a Full-Stack Developer with hands-on experience designing and optimizing scalable web applications and RESTful APIs. I work primarily in React.js, Python, and C#, using them to deliver robust system integrations and seamless data flow. With a strong foundation in Computer Science and a history of high-impact project execution behind me, I'm eager to contribute to innovative teams that value continuous learning and social impact.",
  },
  experience: [
    {
      title: 'Full-Stack Developer',
      org: orgs.grenoble.en,
      marks: marks.grenoble,
      location: 'Riyadh, Saudi Arabia',
      period: periods.grenoble.en,
      current: true,
      tech: tech.grenoble,
      bullets: [
        'Designing, building, and optimizing scalable web applications using front-end and back-end technologies.',
        'Creating, managing, and optimizing databases and APIs to ensure seamless data flow and integration between systems.',
      ],
    },
    {
      title: 'Web Developer',
      org: orgs.smartMethods.en,
      marks: marks.smartMethods,
      location: 'Remote',
      period: periods.smartMethods.en,
      tech: tech.smartMethods,
      bullets: [
        'Built a robot control web tasks using HTML/CSS, JavaScript jQuery, and Python.',
        'Received experience certification for completing 5 successful tasks.',
      ],
    },
  ],
  projects: [
    {
      name: 'Game Accessories Store',
      period: periods.gameStore.en,
      tech: tech.gameStore,
      repos: repos.gameStore,
      description:
        'Built interactive user interfaces with React, implemented RESTful APIs for seamless communication between the front-end and back-end, and utilized PostgreSQL for efficient and secure data management.',
    },
    {
      name: 'CAPTCHA Gamification for Arabic Learning',
      period: periods.captcha.en,
      tech: tech.captcha,
      outcome: '100% final grade',
      repos: repos.captcha,
      description:
        'Collaborated with a co-member and successfully carried out the project within 3 months. Provided the user interface using the Flutter framework and designed the relational database schema using SQLite to collect research data.',
    },
  ],
  education: [
    {
      title: 'Software Development Program',
      org: orgs.sda.en,
      marks: marks.sda,
      location: 'Remote',
      period: periods.sda.en,
      tech: tech.sda,
      bullets: [
        'Focused on frontend development with JavaScript, TypeScript, React.js.',
        'Built backend for web-based applications with frameworks such as C#, ASP.NET Core, and Npgsql.',
        'Learned new concepts such as API development documentation and version control with GitHub.',
      ],
    },
    {
      title: 'Bachelor in Computer Science',
      org: orgs.qassim.en,
      marks: marks.qassim,
      location: 'Qassim, Saudi Arabia',
      period: periods.qassim.en,
      tech: tech.qassim,
      highlight: { label: 'GPA', value: '4.7 / 5' },
      bullets: [
        'Core disciplines: Software Engineering, System Design, Computer Networks.',
        'Graduated with Second Class Honors.',
      ],
    },
  ],
  certifications: [
    {
      name: 'AWS Certified Cloud Practitioner',
      issuer: issuers.aws.name,
      logo: issuers.aws.logo,
      url: issuers.aws.credentialUrl,
      description: 'Validated understanding of AWS architecture, security, and cloud operations.',
    },
    {
      name: 'C# Certificate',
      issuer: issuers.w3schools.name,
      logo: issuers.w3schools.logo,
      url: issuers.w3schools.credentialUrl,
      description: 'Validated proficiency in C#, OOP, and .NET development.',
    },
  ],
  skills: [
    { label: 'Programming Languages', items: skillItems.languages },
    { label: 'Frontend', items: skillItems.frontend },
    { label: 'Backend', items: skillItems.backend },
    { label: 'Cloud & Tools', items: skillItems.cloudTools },
    { label: 'AI-Assisted Dev', items: skillItems.aiAssisted },
    { label: 'Planning', items: skillItems.planning },
  ],
  languages: [
    { name: 'English', endonym: 'English', level: 'Professional' },
    { name: 'Arabic', endonym: 'العربية', level: 'Native' },
  ],
  contact: {
    intro:
      'Open to full-stack roles and interesting problems. Send a message here, or reach me directly.',
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'you@company.com',
    messagePlaceholder: 'What would you like to build?',
    submit: 'send message',
    submitting: 'sending…',
    success: 'Message sent. I will get back to you shortly.',
    error: 'Something went wrong. Please email me directly instead.',
    notConfigured:
      'This form has no endpoint configured yet, so nothing was sent. Please use the email link below.',
    validation: {
      name: 'Please enter your name.',
      email: 'Please enter your email.',
      emailInvalid: 'That does not look like a valid email address.',
      message: 'Please enter a message.',
    },
    directIntro: 'Or reach me directly',
    copyEmail: 'copy email',
    copied: 'copied',
  },
  palette: {
    open: 'Open command palette',
    openShort: 'commands',
    placeholder: 'Type a command or search…',
    empty: 'No matching commands.',
    hintNavigate: 'navigate',
    hintSelect: 'select',
    hintClose: 'close',
    groups: { navigate: 'Go to', actions: 'Actions', links: 'Links' },
    commands: {
      toggleTheme: 'Toggle theme',
      toggleThemeLight: 'Switch to light theme',
      toggleThemeDark: 'Switch to dark theme',
      switchLocale: 'التبديل إلى العربية',
      downloadCv: 'Download CV',
      copyEmail: 'Copy email address',
      openGithub: 'Open GitHub',
      openLinkedin: 'Open LinkedIn',
      sendEmail: 'Send an email',
    },
  },
  ui: {
    themeToLight: 'Switch to light theme',
    themeToDark: 'Switch to dark theme',
    localeSwitch: 'التبديل إلى العربية',
    skipToContent: 'Skip to content',
    menu: 'Sections',
    close: 'Close',
    current: 'current',
    sourceOnGithub: 'source on GitHub',
    verifyCredential: 'Verify credential',
  },
  footer: {
    builtWith: 'Built with React, TypeScript, Tailwind CSS and Vite.',
    rights: 'All rights reserved.',
  },
};

// ---------------------------------------------------------------------------
// Arabic
// ---------------------------------------------------------------------------

const ar: Content = {
  meta: {
    title: 'عبدالعزيز السحيباني — مطوّر ويب متكامل',
    description:
      'مطوّر ويب متكامل في الرياض، المملكة العربية السعودية. React.js وPython وC# وASP.NET وPostgreSQL وAWS.',
  },
  hero: {
    greeting: 'whoami',
    name: 'عبدالعزيز السحيباني',
    role: 'مطوّر ويب متكامل',
    location: 'الرياض، المملكة العربية السعودية',
    tagline: 'أبني تطبيقات ويب قابلة للتوسّع وواجهات البرمجة التي تربطها معًا، مهتم في بناء مشاريع ابداعية و مؤثرة اجتماعياً.',
    downloadCv: 'تحميل السيرة الذاتية',
    contactCta: 'تواصل معي',
  },
  nav: {
    profile: 'نبذة',
    experience: 'الخبرة',
    projects: 'المشاريع',
    education: 'التعليم',
    certifications: 'الشهادات',
    skills: 'المهارات',
    languages: 'اللغات',
    contact: 'التواصل',
  },
  sections: {
    profile: { title: 'نبذة' },
    experience: { title: 'الخبرة العملية' },
    projects: { title: 'المشاريع' },
    education: { title: 'التعليم' },
    certifications: { title: 'الشهادات' },
    skills: { title: 'المهارات' },
    languages: { title: 'اللغات' },
    contact: { title: 'التواصل' },
  },
  profile: {
    body:
      'أنا مطوّر ويب متكامل أمتلك خبرة عملية في تصميم تطبيقات ويب قابلة للتوسّع وواجهات برمجية RESTful وتحسين أدائها. أعمل بشكل أساسي بـ React.js وPython وC#، وأوظّفها لتقديم تكاملات قوية بين الأنظمة وتدفّق سلس للبيانات. وبأساس متين في علوم الحاسب وسجلّ من تنفيذ مشاريع عالية الأثر، أتطلّع للإسهام في فرق مبتكرة تُقدّر التعلّم المستمر والأثر الاجتماعي.',
  },
  experience: [
    {
      title: 'مطوّر ويب متكامل',
      org: orgs.grenoble.ar,
      marks: marks.grenoble,
      location: 'الرياض، المملكة العربية السعودية',
      period: periods.grenoble.ar,
      current: true,
      tech: tech.grenoble,
      bullets: [
        'تصميم وبناء وتحسين تطبيقات ويب قابلة للتوسّع باستخدام تقنيات الواجهة الأمامية والخلفية.',
        'إنشاء وإدارة وتحسين قواعد البيانات وواجهات برمجة التطبيقات لضمان تدفّق سلس للبيانات والتكامل بين الأنظمة.',
      ],
    },
    {
      title: 'مطوّر ويب',
      org: orgs.smartMethods.ar,
      marks: marks.smartMethods,
      location: 'عن بُعد',
      period: periods.smartMethods.ar,
      tech: tech.smartMethods,
      bullets: [
        'بناء مهام ويب للتحكّم في روبوت باستخدام HTML/CSS وJavaScript jQuery وPython.',
        'الحصول على شهادة خبرة بعد إتمام 5 مهام بنجاح.',
      ],
    },
  ],
  projects: [
    {
      name: 'متجر إكسسوارات الألعاب',
      period: periods.gameStore.ar,
      tech: tech.gameStore,
      repos: repos.gameStore,
      description:
        'بناء واجهات مستخدم تفاعلية باستخدام React، وتنفيذ واجهات برمجية RESTful لتواصل سلس بين الواجهة الأمامية والخلفية، واستخدام PostgreSQL لإدارة البيانات بكفاءة وأمان.',
    },
    {
      name: 'تحويل اختبار CAPTCHA إلى لعبة لتعلّم العربية',
      period: periods.captcha.ar,
      tech: tech.captcha,
      outcome: 'درجة نهائية 100%',
      repos: repos.captcha,
      description:
        'التعاون مع زميل في الفريق وإنجاز المشروع بنجاح خلال ثلاثة أشهر. تقديم واجهة المستخدم باستخدام إطار Flutter، وتصميم مخطط قاعدة البيانات العلائقية باستخدام SQLite لغرض بحث اكاديمي.',
    },
  ],
  education: [
    {
      title: 'برنامج تطوير البرمجيات',
      org: orgs.sda.ar,
      marks: marks.sda,
      location: 'عن بُعد',
      period: periods.sda.ar,
      tech: tech.sda,
      bullets: [
        'التركيز على تطوير الواجهات الأمامية باستخدام JavaScript وTypeScript وReact.js.',
        'بناء الواجهة الخلفية لتطبيقات الويب بأطر عمل مثل C# وASP.NET Core وNpgsql.',
        'تعلّم مفاهيم جديدة مثل توثيق تطوير واجهات البرمجة وإدارة الإصدارات عبر GitHub.',
      ],
    },
    {
      title: 'بكالوريوس في علوم الحاسب',
      org: orgs.qassim.ar,
      marks: marks.qassim,
      location: 'القصيم، المملكة العربية السعودية',
      period: periods.qassim.ar,
      tech: tech.qassim,
      highlight: { label: 'المعدّل', value: '4.7 / 5' },
      bullets: [
        'التخصصات الأساسية: هندسة البرمجيات، وتصميم الأنظمة، وشبكات الحاسب.',
        'التخرّج بمرتبة الشرف الثانية.',
      ],
    },
  ],
  certifications: [
    {
      name: 'ممارس في الحوسبة السحابية من AWS',
      issuer: issuers.aws.name,
      logo: issuers.aws.logo,
      url: issuers.aws.credentialUrl,
      description: 'إثبات فهم بنية AWS والأمن وعمليات الحوسبة السحابية.',
    },
    {
      name: 'شهادة C#',
      issuer: issuers.w3schools.name,
      logo: issuers.w3schools.logo,
      url: issuers.w3schools.credentialUrl,
      description: 'إثبات الإتقان في C# والبرمجة كائنية التوجّه وتطوير .NET.',
    },
  ],
  skills: [
    { label: 'لغات البرمجة', items: skillItems.languages },
    { label: 'الواجهة الأمامية', items: skillItems.frontend },
    { label: 'الواجهة الخلفية', items: skillItems.backend },
    { label: 'السحابة والأدوات', items: skillItems.cloudTools },
    { label: 'التطوير بمساعدة الذكاء الاصطناعي', items: skillItems.aiAssisted },
    { label: 'التخطيط', items: skillItems.planning },
  ],
  languages: [
    { name: 'الإنجليزية', endonym: 'English', level: 'إتقان مهني' },
    { name: 'العربية', endonym: 'العربية', level: 'اللغة الأم' },
  ],
  contact: {
    intro: 'متطلع على الفرص في تطوير الويب المتكامل والمشاكل المثيرة للاهتمام. أرسل رسالة هنا أو تواصل معي مباشرة.',
    nameLabel: 'الاسم',
    emailLabel: 'البريد الإلكتروني',
    messageLabel: 'الرسالة',
    namePlaceholder: 'اسمك',
    emailPlaceholder: 'you@company.com',
    messagePlaceholder: 'ما الذي تودّ بناءه؟',
    submit: 'إرسال الرسالة',
    submitting: 'جارٍ الإرسال…',
    success: 'تم إرسال الرسالة. سأتواصل معك قريبًا.',
    error: 'حدث خطأ ما. يُرجى مراسلتي عبر البريد مباشرة.',
    notConfigured:
      'لم يتم ضبط وجهة لهذا النموذج بعد، لذا لم تُرسل الرسالة. يُرجى استخدام رابط البريد أدناه.',
    validation: {
      name: 'يُرجى إدخال اسمك.',
      email: 'يُرجى إدخال بريدك الإلكتروني.',
      emailInvalid: 'لا يبدو هذا بريدًا إلكترونيًا صحيحًا.',
      message: 'يُرجى كتابة رسالة.',
    },
    directIntro: 'أو تواصل معي مباشرة',
    copyEmail: 'نسخ البريد',
    copied: 'تم النسخ',
  },
  palette: {
    open: 'فتح لوحة الأوامر',
    openShort: 'الأوامر',
    placeholder: 'اكتب أمرًا أو ابحث…',
    empty: 'لا توجد أوامر مطابقة.',
    hintNavigate: 'تنقّل',
    hintSelect: 'اختيار',
    hintClose: 'إغلاق',
    groups: { navigate: 'الانتقال إلى', actions: 'إجراءات', links: 'روابط' },
    commands: {
      toggleTheme: 'تبديل المظهر',
      toggleThemeLight: 'التبديل إلى المظهر الفاتح',
      toggleThemeDark: 'التبديل إلى المظهر الداكن',
      switchLocale: 'Switch to English',
      downloadCv: 'تحميل السيرة الذاتية',
      copyEmail: 'نسخ البريد الإلكتروني',
      openGithub: 'فتح GitHub',
      openLinkedin: 'فتح LinkedIn',
      sendEmail: 'إرسال بريد إلكتروني',
    },
  },
  ui: {
    themeToLight: 'التبديل إلى المظهر الفاتح',
    themeToDark: 'التبديل إلى المظهر الداكن',
    localeSwitch: 'Switch to English',
    skipToContent: 'تخطٍّ إلى المحتوى',
    menu: 'الأقسام',
    close: 'إغلاق',
    current: 'الحالي',
    sourceOnGithub: 'المصدر على GitHub',
    verifyCredential: 'تحقق من الشهادة',
  },
  footer: {
    builtWith: 'بُني باستخدام React وTypeScript وTailwind CSS وVite.',
    rights: 'جميع الحقوق محفوظة.',
  },
};

export const content: Record<Locale, Content> = { en, ar };
