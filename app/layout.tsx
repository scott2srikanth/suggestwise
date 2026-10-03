import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CARWISE — Car Buying Decision Intelligence",
  description: "Compare cars by the things that actually matter. Transparent car scorecards, comparisons and ownership estimates for India.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
