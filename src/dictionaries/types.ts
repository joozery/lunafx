export interface NavDictionary {
  links: { label: string; href: string }[];
  login: string;
  openAccount: string;
}

export interface HeroDictionary {
  badge: string;
  titleLines: [string, string, string];
  description: string;
  openAccount: string;
  tryDemo: string;
  trust: { title: string; subtitle: string }[];
}

export interface StatsBarDictionary {
  stats: { title: string; sub: string; desc: string }[];
}

export interface AboutDictionary {
  label: string;
  titleLines: [string, string];
  description: string;
  learnMore: string;
  stats: { value: string; label: string }[];
}

export interface MarketsDictionary {
  label: string;
  title: string;
  viewAll: string;
  viewMore: string;
  items: { title: string; desc: string }[];
}

export interface PlatformsDictionary {
  label: string;
  title: string;
  description: string;
  items: { title: string; desc: string }[];
  cta: string;
}

export interface FooterDictionary {
  advantagesLabel: string;
  advantages: { title: string; desc: string }[];
  about: string;
  columns: {
    markets: { heading: string; links: string[] };
    trading: { heading: string; links: string[] };
    company: { heading: string; links: string[] };
    resources: { heading: string; links: string[] };
  };
  newsletter: { heading: string; description: string; placeholder: string };
  copyright: string;
  legalLinks: { privacy: string; terms: string; aml: string };
}

export interface LoginDictionary {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  forgotPassword: string;
  passwordPlaceholder: string;
  rememberMe: string;
  submit: string;
  noAccount: string;
  openAccount: string;
}

export interface OpenAccountDictionary {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  passwordMismatch: string;
  termsBefore: string;
  termsLabel: string;
  termsBetween: string;
  privacyLabel: string;
  termsAfter: string;
  submit: string;
  haveAccount: string;
  login: string;
}

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  intro?: string;
  items?: string[];
}

export interface LegalContact {
  heading: string;
  before: string;
  after: string;
}

export interface LegalPageDictionary {
  metaTitle: string;
  metaDescription: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  contact: LegalContact;
}

export interface LegalDictionary {
  label: string;
  lastUpdatedLabel: string;
  privacy: LegalPageDictionary;
  terms: LegalPageDictionary;
  aml: LegalPageDictionary;
}

export interface LanguageSwitcherDictionary {
  label: string;
  en: string;
  th: string;
}

export interface ForgotPasswordDictionary {
  metaTitle: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendOtp: string;
  sending: string;
  otpSentMessage: string;
  otpLabel: string;
  otpPlaceholder: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  passwordMismatch: string;
  submit: string;
  submitting: string;
  resendOtp: string;
  backToLogin: string;
  successMessage: string;
  successSubMessage: string;
}

export interface Dictionary {
  nav: NavDictionary;
  hero: HeroDictionary;
  statsBar: StatsBarDictionary;
  about: AboutDictionary;
  markets: MarketsDictionary;
  platforms: PlatformsDictionary;
  footer: FooterDictionary;
  login: LoginDictionary;
  openAccount: OpenAccountDictionary;
  legal: LegalDictionary;
  languageSwitcher: LanguageSwitcherDictionary;
  forgotPassword: ForgotPasswordDictionary;
}
