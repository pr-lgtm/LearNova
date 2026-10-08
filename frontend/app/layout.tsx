import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learnova OS — Study with intention",
  description: "A calmer, more honest system for learning and getting things done.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
