import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/sitemap.xml": ["./src/app/**/page.tsx", "./src/app/**/layout.tsx", "./src/app/home-page.tsx"],
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
