import type { NextConfig } from "next";

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
};

export default nextConfig;
