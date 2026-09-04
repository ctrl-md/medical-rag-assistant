/** @type {import('next').NextConfig} */
// No API rewrite here on purpose. Routing /api/* through Next.js's rewrite
// proxy would run it as a Netlify Function on deploy, and Netlify Functions
// on the free tier have a hard 10-second execution timeout -- far shorter
// than Render's free-tier cold start (30-60s after 15 minutes idle). Instead,
// app/page.tsx fetches the backend directly using NEXT_PUBLIC_BACKEND_URL, so
// the browser's own request (no built-in timeout) is what waits through a
// cold start, not a Netlify Function that would kill it first.
const nextConfig = {};

module.exports = nextConfig;
