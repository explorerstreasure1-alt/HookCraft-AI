import type { Metadata } from "next";
import { AuthProvider } from "@/lib/supabase/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookCraft AI | Video Hook and Script Architect",
  description:
    "HookCraft AI generates scroll-stopping video hooks and scripts for creators. AI-powered openings for TikTok, YouTube Shorts, Instagram Reels, and LinkedIn Video.",
  openGraph: {
    title: "HookCraft AI | Video Hook and Script Architect",
    description:
      "Build the first three seconds before you film. AI-powered video hook generator for content creators.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HookCraft AI | Video Hook and Script Architect",
    description:
      "Build the first three seconds before you film. AI-powered video hook generator for content creators.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
