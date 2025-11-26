import type { NextConfig } from "next";

// Content Security Policy
// Note: 'unsafe-inline' and 'unsafe-eval' needed for Next.js and React development
// E2B sandbox URLs need to be allowed for preview functionality
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.googleusercontent.com https://avatars.githubusercontent.com https://*.r2.dev https://*.e2b.dev;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.e2b.dev wss://*.e2b.dev https://api.resend.com https://api.razorpay.com https://*.razorpay.com https://accounts.google.com https://api.github.com https://*.openai.com https://*.anthropic.com https://*.google.com https://generativelanguage.googleapis.com;
  frame-src 'self' https://*.e2b.dev https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
`.replace(/\n/g, " ").trim();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-e1fc551aa7e245ee99ce7bfc34c8795a.r2.dev",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
