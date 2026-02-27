import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NoteFlow Recovery - Your Personal Recovery Companion",
  description: "A comprehensive substance use recovery companion app with mood tracking, journaling, analytics, and peer support.",
  keywords: ["recovery", "addiction", "substance use", "journal", "mood tracking", "mental health"],
  authors: [{ name: "NoteFlow Team" }],
  openGraph: {
    title: "NoteFlow Recovery",
    description: "Your personal recovery companion",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NoteFlow Recovery",
    description: "Your personal recovery companion",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
