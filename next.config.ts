import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/weco-concept-explorer",
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;