import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // npm sets npm_package_version automatically from package.json during 'npm run build'
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
};

export default nextConfig;
