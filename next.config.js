/** @type {import('next').NextConfig} */
const isNative = process.env.NEXT_PUBLIC_APP_TARGET === 'native';

const nextConfig = {
  reactStrictMode: true,
  ...(isNative && {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

module.exports = nextConfig;
