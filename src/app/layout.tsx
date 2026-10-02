import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
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
    <html lang="id" className={`${inter.variable} ${plusJakarta.variable} antialiased scroll-smooth`} suppressHydrationWarning>
      <body className="antialiased bg-zinc-950 text-stone-300 selection:bg-amber-600/30 selection:text-amber-100 overflow-x-hidden" suppressHydrationWarning>
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
