import MillionLint from "@million/lint";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Assuming staleTimes was intended
    staleTimes: {
      dynamic: 30,
    },
  },
  // Moved from experimental in Next.js 15+
  serverExternalPackages: ["@uploadthing/dropzone", "@uploadthing/mime-types", "@uploadthing/react", "@uploadthing/shared"],
  images: {
    // Assuming remotePatterns existed and is needed
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  reactStrictMode: true, // Assuming this was intended
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Assuming the original fallback logic was needed for other things
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback, // Keep existing fallbacks if any
          fs: false,
          net: false,
          tls: false,
          cardinal: false, // Assuming these were original fallbacks needed
        },
      };
    }
    // Removed Argon2 externals modifications for server
    // Removed Argon2 resolve.fallback modification
    // Removed node-loader rule

    return config;
  },
};

// Million Lint currently breaks runtime in this app (React 19 / Next 15),
// producing errors like "ReactCurrentOwner" and "[Million Lint] No open ports found".
// Keep it available, but only enable it explicitly (or in production if you choose).
const enableMillion =
  process.env.MILLION_LINT === "1" ||
  process.env.NEXT_PUBLIC_MILLION_LINT === "1";

export default enableMillion ? MillionLint.next(nextConfig) : nextConfig;
