import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://10.0.0.190:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;