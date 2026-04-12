/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module — tell Next.js not to bundle it.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
