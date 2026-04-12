/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module — tell Next.js not to bundle it.
  serverExternalPackages: ["better-sqlite3"],
  // Suppress prerender warnings for pages that access DB at request time.
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
