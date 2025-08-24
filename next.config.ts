import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: ["jsdom", "isomorphic-dompurify"],
  webpack: (config) => {
    // Exclude the data directory from webpack processing
    config.module.rules.push({
      test: /\/data\//,
      loader: "ignore-loader",
    });

    return config;
  },
};

export default nextConfig;
