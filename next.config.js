/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Removed static export for Vercel deployment with API routes
   * API routes require serverless functions
   */
  // output: "export",  // Commented out for Vercel deployment

  /**
   * Ensure trailing slashes for consistent URLs.
   *
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash
   */
  trailingSlash: true,

  /**
   * Pin workspace root so Next.js does not infer from parent lockfiles.
   */
  outputFileTracingRoot: __dirname,

  /**
   * Keep images unoptimized for faster builds
   * Can enable optimization later if needed
   *
   * @see https://nextjs.org/docs/app/api-reference/components/image#unoptimized
   */
  images: {
    unoptimized: true,
    qualities: [75, 85],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

module.exports = nextConfig
