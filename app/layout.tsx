import type { Metadata } from "next";
import { DM_Sans, Caveat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const ppWriter = localFont({
  src: [
    { path: '../public/fonts/PPWriter-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/PPWriter-RegularItalic.otf', weight: '400', style: 'italic' },
    { path: '../public/fonts/PPWriter-Book.otf', weight: '450', style: 'normal' },
    { path: '../public/fonts/PPWriter-Bold.otf', weight: '700', style: 'normal' },
    { path: '../public/fonts/PPWriter-BoldItalic.otf', weight: '700', style: 'italic' },
  ],
  variable: '--font-ppwriter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dear Friends",
  description: "Collect mailing addresses and send personalized letters",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ppWriter.variable} ${dmSans.variable} ${caveat.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
