
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

export default nextConfig;
