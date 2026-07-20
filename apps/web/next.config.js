/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cloudarch/shared"],
  output: "standalone",
};

module.exports = nextConfig;
