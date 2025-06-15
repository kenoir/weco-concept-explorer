import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/weco-concept-explorer",
  trailingSlash: true,
  reactStrictMode: true, // existing option
  // any other existing configurations
};

export default nextConfig;
