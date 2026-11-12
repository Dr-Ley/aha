import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next 16 writes .next/dev/logs on every message. On Windows that file
    // stays locked, and the failed flush retries until the terminal fills.
    mcpServer: false,
  },
  serverExternalPackages: ["@react-pdf/renderer", "@react-email/render", "mongodb", "pg", "prismjs", "react-email"],
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./src/app/**/page.tsx", "./src/app/**/layout.tsx", "./src/app/(aha)/home-page.tsx"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "aha-africanhomeadventure.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
      
    ],
  },
};

export default nextConfig;
