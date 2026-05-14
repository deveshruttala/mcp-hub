import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "AgentHub — One hub for every AI agent",
  description:
    "Connect tools once. Store memory once. Manage permissions once. AgentHub is the universal MCP and AI agent operating system for ChatGPT, Claude, Cursor, Gemini and beyond.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
