import path from "node:path";

const root = import.meta.dirname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: root,
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@config": path.join(root, "app.config.json"),
      "@": path.join(root, "src"),
    };
    return config;
  },
};
export default nextConfig;
