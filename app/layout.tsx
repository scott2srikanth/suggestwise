import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SuggestWise — Decision Intelligence for India",
  description: "Compare cars, travel, restaurants, hotels, Hyderabad homes and education using transparent criteria and personalized rankings.",
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
