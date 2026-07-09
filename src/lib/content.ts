/**
 * Static marketing content for NurvexThink (services, stats, process, values,
 * team, FAQ). Products and blog posts are NOT here — they're stored in Supabase
 * and fetched via src/lib/queries.ts. The Product and BlogPost types below are
 * the view-model shapes those queries return.
 */

export type Social = {
  /** Must match a SocialName in components/social-icons.tsx */
  label: "GitHub" | "LinkedIn" | "Instagram" | "X" | "YouTube" | "TikTok";
  handle: string;
  href: string;
};

export const siteConfig = {
  name: "NurvexThink",
  tagline: "Software, built and published.",
  description:
    "A software studio that designs, builds, and ships products — and takes custom software on demand.",
  email: "nurvexthink@gmail.com",
  founded: "2026",
  socials: [
    { label: "GitHub", handle: "nurvexthink", href: "https://github.com/nurvexthink" },
    {
      label: "LinkedIn",
      handle: "nurvexthink",
      href: "https://www.linkedin.com/company/nurvexthink/",
    },
    {
      label: "Instagram",
      handle: "@nurvexthink",
      href: "https://www.instagram.com/nurvexthink/",
    },
    { label: "X", handle: "@nurvexthink", href: "https://x.com/nurvexthink" },
    {
      label: "YouTube",
      handle: "NurvexThink",
      href: "https://www.youtube.com/channel/UCUttTw2GdvnD8XkaFqTbARQ",
    },
    {
      label: "TikTok",
      handle: "@nurvexthink8",
      href: "https://www.tiktok.com/@nurvexthink8",
    },
  ] satisfies Social[],
};

export type Stat = { value: string; label: string };
export const stats: Stat[] = [
  { value: "100%", label: "Built in-house" },
  { value: "< 1 wk", label: "To first preview" },
  { value: "24/7", label: "Monitored" },
  { value: "2026", label: "Founded" },
];

export type Service = {
  icon: string;
  title: string;
  description: string;
};
export const services: Service[] = [
  {
    icon: "Rocket",
    title: "Published products",
    description: "Our own software, built and launched.",
  },
  {
    icon: "Workflow",
    title: "Custom software",
    description: "You bring the problem. We ship the system.",
  },
  {
    icon: "Code2",
    title: "Product engineering",
    description: "Web and mobile apps, built to ship.",
  },
  {
    icon: "Sparkles",
    title: "Design & interface",
    description: "Interfaces that feel fast and considered.",
  },
  {
    icon: "Database",
    title: "Cloud & data",
    description: "Databases and deploys that scale to zero.",
  },
  {
    icon: "Cpu",
    title: "AI features",
    description: "Practical AI: search, assistants, automation.",
  },
];

// Products live in the `products` table; fetched via getProducts/getProductDetailBySlug.
export type RelatedChip = { slug: string; title: string };

export type Product = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  summary: string;
  description: string;
  status: "Live" | "Beta" | "Soon";
  tags: string[];
  year: string;
  liveUrl: string;
  repoUrl: string | null;
  coverImage: string | null;
  highlights: string[];
  featured: boolean;
  related: RelatedChip[];
};

export type ProductFeature = { title: string; description: string; image: string | null };

export type RelatedPost = { slug: string; title: string; excerpt: string; coverImage: string | null };

export type ProductDetail = Product & {
  descriptionParagraphs: string[];
  technicalParagraphs: string[];
  gallery: string[];
  features: ProductFeature[];
  relatedPosts: RelatedPost[];
  seoDescription: string;
  ogImage: string | null;
};

export type ProcessStep = { step: string; title: string; description: string };
export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Scope",
    description: "We map the problem and agree on the plan.",
  },
  {
    step: "02",
    title: "Build",
    description: "Working software every week, live from day one.",
  },
  {
    step: "03",
    title: "Ship & support",
    description: "We launch, monitor, and keep improving.",
  },
];

// Blog posts live in the `blog_posts` table; fetched via getPosts/getPostBySlug.
export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  author: string;
  content: string[];
};

export type Value = { title: string; description: string };
export const values: Value[] = [
  {
    title: "Own what we ship",
    description: "We build it, launch it, and stand behind it. No throwing code over a wall.",
  },
  {
    title: "Ship small, ship often",
    description: "Working software beats big promises. Every week there's something to click.",
  },
  {
    title: "Clarity over cleverness",
    description: "Simple systems the next person can understand — including future us.",
  },
  {
    title: "Measure real outcomes",
    description: "Success is what your users actually do, not what a slide deck claims.",
  },
];

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
};
export const team: TeamMember[] = [
  {
    name: "Fatima Abdul Raheem",
    role: "Chief Executive Officer",
    bio: "Sets the product direction and makes sure the things we ship are worth shipping.",
    initials: "FA",
  },
];

export type Faq = { q: string; a: string };
export const faqs: Faq[] = [
  {
    q: "How does a custom project start?",
    a: "With a conversation and a short scope. We define the problem and what success looks like, then send a plan with milestones before any code is written.",
  },
  {
    q: "Do you only build web apps?",
    a: "Web is our home base, but we also build mobile apps, internal tools, APIs, and AI features. If it's software, we can probably help.",
  },
  {
    q: "Who owns the code?",
    a: "You do. Custom work is delivered to your repositories and accounts. Our published products stay ours, but anything we build for you is yours.",
  },
  {
    q: "How fast can we see something?",
    a: "Usually within a week. We set up a live preview link early so you can watch the product take shape instead of waiting for a big reveal.",
  },
];
