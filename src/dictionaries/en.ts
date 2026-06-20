import type { Dictionary } from "./types";

const en: Dictionary = {
  nav: {
    links: [
      { label: "Trading", href: "/trading" },
      { label: "Markets", href: "/markets" },
      { label: "Platforms", href: "/platforms" },
      { label: "Resources", href: "/resources" },
      { label: "Company", href: "/company" },
      { label: "Partnership", href: "/partnership" },
    ],
    login: "Login",
    openAccount: "Open Account",
  },
  hero: {
    badge: "TRADE WITH CONFIDENCE",
    titleLines: ["Precision.", "Power.", "Performance."],
    description: "Luxa FX empowers traders with institutional technology, deep liquidity, and tight spreads.",
    openAccount: "Open Account",
    tryDemo: "Try Demo",
    trust: [
      { title: "Regulated", subtitle: "& Secure" },
      { title: "Ultra-Fast", subtitle: "Execution" },
      { title: "24/5", subtitle: "Support" },
      { title: "Deep", subtitle: "Liquidity" },
    ],
  },
  statsBar: {
    stats: [
      { title: "0.0", sub: "Pips", desc: "Lowest Spreads" },
      { title: "500:1", sub: "Leverage", desc: "Max Leverage" },
      { title: "150+", sub: "Instruments", desc: "Forex, Metals, Indices,\nCommodities, Stocks" },
      { title: "24/5", sub: "Support", desc: "Dedicated Support" },
      { title: "99.9%", sub: "Uptime", desc: "Reliable Execution" },
    ],
  },
  about: {
    label: "About Luxa FX",
    titleLines: ["Built for Traders.", "Backed by Experience."],
    description:
      "Luxa FX is a next-generation broker delivering institutional-grade trading conditions to clients worldwide. Our mission is to provide a transparent, secure, and innovative trading environment where traders can achieve more.",
    learnMore: "Learn More",
    stats: [
      { value: "$10B+", label: "Monthly Trading Volume" },
      { value: "60,000+", label: "Active Traders" },
      { value: "10+", label: "Global Awards" },
    ],
  },
  markets: {
    label: "Trade Global Markets",
    title: "Diverse Markets, Endless Opportunities",
    viewAll: "View All Instruments",
    viewMore: "View More",
    items: [
      { title: "Forex", desc: "Trade 60+ currency pairs with tight spreads" },
      { title: "Metals", desc: "Gold, Silver, Platinum and more" },
      { title: "Indices", desc: "Global indices from major exchanges" },
      { title: "Commodities", desc: "Energy, agriculture and industrial commodities" },
      { title: "Stocks", desc: "100+ stocks from global companies" },
    ],
  },
  platforms: {
    label: "Advanced Trading Technology",
    title: "Trade Your Way",
    description: "Access global markets on powerful platforms designed for both beginner and professional traders.",
    items: [
      { title: "Web Trader", desc: "Trade directly in your browser" },
      { title: "Desktop", desc: "Advanced tools for professional traders" },
      { title: "Mobile", desc: "Trade on the go anytime, anywhere" },
    ],
    cta: "Explore Platforms",
  },
  footer: {
    advantagesLabel: "Why Traders Choose Lunaforex",
    advantages: [
      { title: "Tight Spreads", desc: "Starting from 0.0 pips" },
      { title: "No Hidden Fees", desc: "Transparent pricing" },
      { title: "Fast Withdrawals", desc: "Secure & reliable" },
      { title: "Negative Balance", desc: "Protection" },
    ],
    about:
      "Lunaforex is a global online broker providing superior trading conditions, cutting-edge technology, and exceptional client support to traders worldwide.",
    columns: {
      markets: { heading: "Markets", links: ["Forex", "Metals", "Indices", "Commodities", "Stocks"] },
      trading: {
        heading: "Trading",
        links: ["Account Types", "Platforms", "Trading Conditions", "Economic Calendar", "Demo Account"],
      },
      company: { heading: "Company", links: ["About Us", "Our Team", "Careers", "News", "Contact Us"] },
      resources: { heading: "Resources", links: ["Help Center", "FAQs", "Glossary", "Market Analysis"] },
    },
    newsletter: {
      heading: "Newsletter",
      description: "Stay updated with the latest market news and trading insights.",
      placeholder: "Enter your email",
    },
    copyright: "© 2024 Lunaforex. All rights reserved.",
    legalLinks: { privacy: "Privacy Policy", terms: "Terms & Conditions", aml: "AML Policy" },
  },
  login: {
    metaTitle: "Login | Lunaforex",
    metaDescription: "Login to your Lunaforex trading account.",
    heading: "Welcome back",
    subheading: "Login to access your trading dashboard.",
    emailLabel: "Email Address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    forgotPassword: "Forgot password?",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    submit: "Login",
    noAccount: "Don't have an account?",
    openAccount: "Open Account",
  },
  openAccount: {
    metaTitle: "Open Account | Lunaforex",
    metaDescription: "Create your Lunaforex trading account in minutes.",
    heading: "Create your account",
    subheading: "Trade with confidence. Open your Lunaforex account in minutes.",
    firstNameLabel: "First Name",
    firstNamePlaceholder: "John",
    lastNameLabel: "Last Name",
    lastNamePlaceholder: "Doe",
    emailLabel: "Email Address",
    emailPlaceholder: "you@example.com",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+1 234 567 8900",
    passwordLabel: "Password",
    passwordPlaceholder: "Create a password",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",
    passwordMismatch: "Passwords do not match.",
    termsBefore: "I agree to the ",
    termsLabel: "Terms & Conditions",
    termsBetween: " and ",
    privacyLabel: "Privacy Policy",
    termsAfter: ".",
    submit: "Create Account",
    haveAccount: "Already have an account?",
    login: "Login",
  },
  legal: {
    label: "Legal",
    lastUpdatedLabel: "Last updated",
    privacy: {
      metaTitle: "Privacy Policy | Lunaforex",
      metaDescription: "How Lunaforex collects, uses, and protects your personal information.",
      title: "Privacy Policy",
      lastUpdated: "June 20, 2026",
      sections: [
        {
          heading: "1. Introduction",
          paragraphs: [
            'Lunaforex ("Lunaforex", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, open a trading account, or use any of our services.',
          ],
        },
        {
          heading: "2. Information We Collect",
          intro: "We may collect the following categories of information:",
          items: [
            "Identity information, such as your name, date of birth, and government-issued ID.",
            "Contact information, such as your email address, phone number, and mailing address.",
            "Financial information, such as bank details, payment records, and trading activity.",
            "Technical information, such as IP address, browser type, and device identifiers.",
          ],
        },
        {
          heading: "3. How We Use Your Information",
          intro: "We use the information we collect to:",
          items: [
            "Verify your identity and process your account application.",
            "Provide, maintain, and improve our trading platforms and services.",
            "Process deposits, withdrawals, and other transactions.",
            "Comply with legal and regulatory obligations, including anti-money laundering checks.",
            "Communicate with you about your account, promotions, and service updates.",
          ],
        },
        {
          heading: "4. Cookies & Tracking Technologies",
          paragraphs: [
            "We use cookies and similar tracking technologies to recognize your browser, remember your preferences, and analyze how our website is used. You can control cookies through your browser settings, though disabling them may limit certain features of our services.",
          ],
        },
        {
          heading: "5. Data Sharing & Third Parties",
          paragraphs: [
            "We do not sell your personal information. We may share information with payment processors, regulatory authorities, identity verification providers, and other service providers who help us operate our business, subject to confidentiality obligations.",
          ],
        },
        {
          heading: "6. Data Security",
          paragraphs: [
            "We implement administrative, technical, and physical safeguards designed to protect your information from unauthorized access, alteration, or disclosure. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
          ],
        },
        {
          heading: "7. Your Rights",
          paragraphs: [
            "Depending on your jurisdiction, you may have the right to access, correct, or delete your personal information, object to certain processing, or request a copy of your data. To exercise these rights, please contact us using the details below.",
          ],
        },
        {
          heading: "8. Data Retention",
          paragraphs: [
            "We retain personal information for as long as necessary to provide our services and comply with legal, regulatory, and accounting requirements.",
          ],
        },
        {
          heading: "9. Changes to This Policy",
          paragraphs: [
            'We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "Last updated" date.',
          ],
        },
      ],
      contact: {
        heading: "10. Contact Us",
        before:
          "If you have any questions about this Privacy Policy or how we handle your information, please contact us at ",
        after: ".",
      },
    },
    terms: {
      metaTitle: "Terms & Conditions | Lunaforex",
      metaDescription: "The terms and conditions governing your use of Lunaforex's services.",
      title: "Terms & Conditions",
      lastUpdated: "June 20, 2026",
      sections: [
        {
          heading: "1. Acceptance of Terms",
          paragraphs: [
            "By accessing our website or opening a trading account with Lunaforex, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our services.",
          ],
        },
        {
          heading: "2. Eligibility",
          paragraphs: [
            "You must be at least 18 years old and have the legal capacity to enter into binding contracts in your jurisdiction to use our services. We reserve the right to refuse service to anyone who does not meet these requirements.",
          ],
        },
        {
          heading: "3. Account Registration",
          paragraphs: [
            "To open a trading account, you must provide accurate and complete information and complete our identity verification process. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
          ],
        },
        {
          heading: "4. Trading Services & Risk Disclosure",
          paragraphs: [
            "Trading forex, metals, indices, commodities, and other leveraged products carries a high level of risk and may not be suitable for all investors. You could lose more than your initial deposit. You should carefully consider your investment objectives, experience, and risk appetite before trading.",
          ],
        },
        {
          heading: "5. Deposits & Withdrawals",
          paragraphs: [
            "Deposits and withdrawals are processed in accordance with our payment policies. We reserve the right to request additional verification before processing a withdrawal and to decline transactions that appear fraudulent or non-compliant with our policies.",
          ],
        },
        {
          heading: "6. Prohibited Activities",
          intro: "You agree not to use our services to:",
          items: [
            "Engage in market manipulation, including but not limited to arbitrage exploiting system errors.",
            "Use our platforms for any unlawful purpose, including money laundering or fraud.",
            "Attempt to gain unauthorized access to our systems or another user's account.",
          ],
        },
        {
          heading: "7. Intellectual Property",
          paragraphs: [
            "All content on our website and platforms, including logos, trademarks, software, and trading tools, is the property of Lunaforex or its licensors and may not be copied, modified, or distributed without prior written consent.",
          ],
        },
        {
          heading: "8. Limitation of Liability",
          paragraphs: [
            "To the fullest extent permitted by law, Lunaforex shall not be liable for any indirect, incidental, or consequential losses arising from your use of our services, including losses resulting from market volatility, system downtime, or third-party actions.",
          ],
        },
        {
          heading: "9. Termination",
          paragraphs: [
            "We may suspend or terminate your account at our discretion if you breach these Terms & Conditions, engage in prohibited activities, or if required by applicable law or regulation.",
          ],
        },
        {
          heading: "10. Governing Law",
          paragraphs: [
            "These Terms & Conditions are governed by the laws of the jurisdiction in which Lunaforex is registered, without regard to conflict of law principles.",
          ],
        },
        {
          heading: "11. Changes to These Terms",
          paragraphs: [
            "We may revise these Terms & Conditions at any time. Continued use of our services after changes are posted constitutes your acceptance of the updated terms.",
          ],
        },
      ],
      contact: {
        heading: "12. Contact Us",
        before: "For questions about these Terms & Conditions, please contact us at ",
        after: ".",
      },
    },
    aml: {
      metaTitle: "AML Policy | Lunaforex",
      metaDescription: "Lunaforex's Anti-Money Laundering policy and compliance commitments.",
      title: "AML Policy",
      lastUpdated: "June 20, 2026",
      sections: [
        {
          heading: "1. Our Commitment",
          paragraphs: [
            "Lunaforex is committed to preventing money laundering, terrorist financing, and other financial crimes. We maintain an Anti-Money Laundering (AML) program designed to comply with applicable laws and regulations in the jurisdictions in which we operate.",
          ],
        },
        {
          heading: "2. Customer Due Diligence (KYC)",
          paragraphs: [
            "Before opening an account, all clients must complete our Know Your Customer (KYC) process, which includes verifying identity, address, and, where applicable, source of funds. We may request additional documentation at any time to maintain compliance.",
          ],
        },
        {
          heading: "3. Source of Funds & Wealth",
          paragraphs: [
            "We may require clients to provide information about the source of funds used for trading and the source of their overall wealth, particularly for larger deposits or where activity appears inconsistent with the client's profile.",
          ],
        },
        {
          heading: "4. Monitoring & Reporting",
          paragraphs: [
            "We monitor client transactions and account activity on an ongoing basis to detect patterns that may indicate money laundering, terrorist financing, or other illicit activity. Suspicious activity is escalated for internal review and reported to the relevant authorities where required.",
          ],
        },
        {
          heading: "5. Sanctions Compliance",
          paragraphs: [
            "We screen clients against applicable sanctions lists and do not knowingly provide services to individuals or entities that are subject to sanctions, or who are residents of jurisdictions subject to comprehensive sanctions.",
          ],
        },
        {
          heading: "6. Record Keeping",
          paragraphs: [
            "We retain client identification records, transaction records, and related documentation for the period required by applicable law, and may provide such records to regulators or law enforcement upon lawful request.",
          ],
        },
        {
          heading: "7. Employee Training",
          paragraphs: [
            "Our employees receive regular training on AML obligations, red flags for suspicious activity, and the procedures for escalating concerns internally.",
          ],
        },
        {
          heading: "8. Reporting Suspicious Activity",
          paragraphs: [
            "If you become aware of any activity on our platform that may violate this AML Policy, please report it to us immediately so that we can investigate.",
          ],
        },
      ],
      contact: {
        heading: "9. Contact Us",
        before: "For questions about this AML Policy or to report suspicious activity, please contact our compliance team at ",
        after: ".",
      },
    },
  },
  languageSwitcher: {
    label: "Language",
    en: "EN",
    th: "TH",
  },
};

export default en;
