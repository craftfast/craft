import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "@/components/SessionProvider";
import { CreditBalanceProvider } from "@/contexts/CreditBalanceContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatPositionProvider } from "@/contexts/ChatPositionContext";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Craft Apps Faster by just Chatting with AI",
  description:
    "Craft is a revolutionary open-source vibecoding tool that lets you build apps and websites through natural conversation with AI.",
  keywords:
    "AI development, vibecoding, app building, chatbot development, open source",
  authors: [{ name: "Craft Team" }],
  creator: "Craft",
  openGraph: {
    title: "Craft - Build Apps by Chatting with AI",
    description:
      "Build apps and websites through natural conversation with AI.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Craft - Build Apps by Chatting with AI",
    description:
      "Build apps and websites through natural conversation with AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Initialize theme before page renders to prevent flash */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider>
            <ChatPositionProvider>
              <CreditBalanceProvider>{children}</CreditBalanceProvider>
            </ChatPositionProvider>
          </ThemeProvider>
        </SessionProvider>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
