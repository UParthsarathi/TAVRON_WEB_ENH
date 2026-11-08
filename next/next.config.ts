import type { NextConfig } from "next";

// The old URLs stay: /bulkCoolers.html is served by app/bulkCoolers/page.tsx.
const nextConfig: NextConfig = {
  turbopack: { root: __dirname }, // the repo root has its own package-lock.json (the test harness)
  async rewrites() {
    return [
      { source: "/index.html", destination: "/" },
      { source: "/:page.html", destination: "/:page" },
    ];
  },
};

export default nextConfig;
