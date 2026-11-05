/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // 語根記事の旧 slug (eiken1-root-{語根}) → /blog/{語根}
      { source: '/blog/eiken1-root-:root', destination: '/blog/:root', permanent: true },
      { source: '/blog/eiken1-root-:root/cover.png', destination: '/blog/:root/cover.png', permanent: true },
      { source: '/blog/preview/eiken1-root-:root', destination: '/blog/preview/:root', permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        destination: '/apple-app-site-association',
      },
    ];
  },
};

module.exports = nextConfig;
