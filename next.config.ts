import type { NextConfig } from "next";

const repo = "weco-concept-explorer";
const isGithubPages = process.env.GITHUB_ACTIONS || process.env.DEPLOY_ENV === 'GH_PAGES';

const nextConfig: NextConfig = {
  output: "export",
  ...(isGithubPages && {
    basePath: `/${repo}`,
    assetPrefix: `/${repo}/`,
  }),
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;