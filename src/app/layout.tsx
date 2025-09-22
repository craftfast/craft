import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
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
  title: "Craft - Build Apps by Chatting with AI",
  description:
    "Join the waitlist for Craft, the revolutionary open-source vibecoding tool that lets you build apps and websites through natural conversation with AI.",
  keywords:
    "AI development, vibecoding, app building, chatbot development, open source, beta access",
  authors: [{ name: "Craft Team" }],
  creator: "Craft",
  openGraph: {
    title: "Craft - Build Apps by Chatting with AI",
    description:
      "Join the waitlist for the future of app development. Build apps and websites through natural conversation with AI.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Craft - Build Apps by Chatting with AI",
    description:
      "Join the waitlist for the future of app development. Build apps and websites through natural conversation with AI.",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
