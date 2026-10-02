import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMP Negeri 3 Cihampelas — Smart Campus",
  description: "Website resmi SMP Negeri 3 Cihampelas. Pendidikan modern, inovatif, dan berkarakter siap menyongsong masa depan.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${manrope.variable} ${playfair.variable} antialiased scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased bg-zinc-950 text-stone-300 selection:bg-amber-600/30 selection:text-amber-100 overflow-x-hidden" suppressHydrationWarning>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
