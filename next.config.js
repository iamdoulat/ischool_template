// next.config.js
/**
 * Next.js configuration file.
 * Enables the experimental app directory located under `src/app`.
 * This resolves 404 errors for routes defined in the `src/app` folder.
 */
module.exports = {
  reactStrictMode: true,
  // Optional: define the base URL for the frontend if needed.
  // env: {
  //   NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  // },
};
