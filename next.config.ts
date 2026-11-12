import type { NextConfig } from "next";

// Hosts next/image may load uploads from. Files live in S3-compatible storage,
// so the host moves with the deployment (Hetzner → MinIO → CDN domain) and the
// bucket is part of the path, hence no pathname filter. Extra hosts can be
// added at build time via IMAGE_HOSTS (comma-separated) without a code change.
const imageHosts = [
  "cdn.kpos.uz",
  "minio-z4488o8g0g4s4wcssww8g8s0.116.202.26.85.sslip.io",
  "fsn1.your-objectstorage.com",
  "hel1.your-objectstorage.com",
  ...(process.env.IMAGE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
];

const nextConfig: NextConfig = {
  // Produce a minimal self-contained server for Docker (.next/standalone).
  output: "standalone",
  images: {
    remotePatterns: imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
};

export default nextConfig;
