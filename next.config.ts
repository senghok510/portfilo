import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" emits a self-contained server in .next/standalone for the Docker image.
  // It is only enabled when NEXT_OUTPUT_STANDALONE is set (see Dockerfile), because
  // Vercel does its own bundling and fails to build with this option turned on.
  output: process.env.NEXT_OUTPUT_STANDALONE ? "standalone" : undefined,
};

export default nextConfig;
