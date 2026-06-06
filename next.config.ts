import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mistralai/mistralai", "@supabase/supabase-js"],
};

export default nextConfig;
