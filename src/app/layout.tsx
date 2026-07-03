import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { AmbientBackground } from "@/components/ambient-background";

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
  metadataBase: new URL("https://nurvexthink.com"),
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
