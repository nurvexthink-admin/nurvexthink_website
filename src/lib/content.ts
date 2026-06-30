/**
 * Static marketing content for NurvexThink (services, stats, process, values,
 * team, FAQ). Products and blog posts are NOT here — they're stored in Supabase
 * and fetched via src/lib/queries.ts. The Product and BlogPost types below are
 * the view-model shapes those queries return.
 */

export const siteConfig = {
  name: "NurvexThink",
  tagline: "Software, built and published.",
  description:
    "A software studio that designs, builds, and ships products — and takes custom software on demand.",
  email: "nurvexthink@gmail.com",
  founded: "2026",
  socials: [
    { label: "GitHub", href: "https://github.com/nurvexthink" },
    { label: "X", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
};

export type Stat = { value: string; label: string };
export const stats: Stat[] = [
  { value: "100%", label: "Built & owned in-house" },
  { value: "< 1 wk", label: "From kickoff to a preview link" },
  { value: "24/7", label: "Uptime monitoring on what we ship" },
  { value: "2026", label: "Studio founded" },
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
    description:
      "We build and launch our own software, then put it in your hands — explore the catalog and use it today.",
  },
  {
    icon: "Workflow",
    title: "Custom software on demand",
    description:
      "Tell us the problem. We scope it, design it, and deliver the system that solves it — end to end.",
  },
  {
    icon: "Code2",
    title: "Product engineering",
    description:
      "Web and mobile apps built to ship, from first commit to production, with a preview link from day one.",
  },
  {
    icon: "Sparkles",
    title: "Design & interface",
    description:
      "Interfaces that feel considered: clear, fast, accessible, and unmistakably on-brand.",
  },
  {
    icon: "Database",
    title: "Cloud & data",
    description:
      "Databases, deploys, and pipelines that stay up under load and scale back down to near-zero cost.",
  },
  {
    icon: "Cpu",
    title: "AI features",
    description:
      "Practical AI woven into products — search, assistants, and automation that earn their place.",
  },
];

// Products live in the `products` table; fetched via getProducts/getProductBySlug.
export type Product = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  description: string;
  status: "Live" | "Beta" | "Soon";
  tags: string[];
  year: string;
  liveUrl: string;
};

export type ProcessStep = { step: string; title: string; description: string };
export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Scope",
    description:
      "We map the problem, agree on what success looks like, and hand you a plan you can actually see — not a black box.",
  },
  {
    step: "02",
    title: "Build",
    description:
      "Short cycles with working software every week and a preview link from day one, so there are no surprises at the end.",
  },
  {
    step: "03",
    title: "Ship & support",
    description:
      "We launch, watch the metrics, and keep improving what we shipped — monitoring and fixes included.",
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
  {
    name: "Muhammad Ali",
    role: "Chief Financial Officer",
    bio: "Runs operations and the numbers so the building never has to stop.",
    initials: "MA",
  },
  {
    name: "Join the studio",
    role: "We're hiring",
    bio: "We're a small team that ships a lot. If that sounds like you, we'd love to talk.",
    initials: "+",
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
