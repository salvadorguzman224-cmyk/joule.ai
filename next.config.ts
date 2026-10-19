import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (Cloud Run).
  output: "standalone",
};

export default nextConfig;
