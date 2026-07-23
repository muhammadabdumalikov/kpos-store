import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a minimal self-contained server for Docker (.next/standalone).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fsn1.your-objectstorage.com",
        pathname: "/pimpo/**",
      },
    ],
  },
};

export default nextConfig;
