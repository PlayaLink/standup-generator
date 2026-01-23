/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@standup/core'],
  // Pass server-side env vars to the transpiled @standup/core package
  env: {
    JIRA_CLIENT_ID: process.env.JIRA_CLIENT_ID,
    JIRA_CLIENT_SECRET: process.env.JIRA_CLIENT_SECRET,
    JIRA_REDIRECT_URI: process.env.JIRA_REDIRECT_URI,
  },
};

export default nextConfig;
