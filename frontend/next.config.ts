import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
