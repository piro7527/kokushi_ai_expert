import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kokushi AI Expert",
  description: "Advanced Physical Therapy National Examination Support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body
        className={`${outfit.variable} ${inter.variable} font-sans antialiased bg-zinc-950 text-zinc-50 selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        {children}
      </body>
    </html>
  );
}
