import type { Metadata } from "next";
import { Noto_Sans_TC, Outfit } from "next/font/google";
import "./globals.css";

const body = Noto_Sans_TC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "滬江小學活動週活動安排登記表",
  description: "滬江小學 2026/27 年度活動週活動安排登記",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
