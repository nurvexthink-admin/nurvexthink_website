import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/site-url";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AmbientBackground } from "@/components/ambient-background";
import { ChatMount } from "@/components/chat/chat-mount";
import { getPublicChatSettings } from "@/lib/chatbot/context";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NurvexThink — Software, built and published",
    template: "%s — NurvexThink",
  },
  description:
    "NurvexThink is a software studio that designs, builds, and ships products — and takes custom software on demand.",
  openGraph: {
    title: "NurvexThink — Software, built and published",
    description:
      "A software studio that designs, builds, and ships products — and takes custom software on demand.",
    siteName: "NurvexThink",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "NurvexThink" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // One cached read per request (see getPublicChatSettings) — the navbar tab and
  // the floating widget both depend on the same on/off switch.
  const chat = await getPublicChatSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", sans.variable, heading.variable, mono.variable)}
    >
      <body className="flex min-h-full flex-col antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AmbientBackground />
          <Navbar chatEnabled={chat.enabled} />
          <main className="flex-1">{children}</main>
          <Footer />
          {/* Renders nothing at all while the chatbot is switched off in /admin/chatbot. */}
          <ChatMount />
        </ThemeProvider>
      </body>
    </html>
  );
}
