import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.100.22",
  ],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
