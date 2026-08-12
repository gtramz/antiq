/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@antiq/nebula", "@antiq/types"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
