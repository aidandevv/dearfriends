import type { Metadata } from "next";
import localFont from "next/font/local";
import "leaflet/dist/leaflet.css";
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

const dmSans = localFont({
  src: [
    { path: '../public/fonts/DMSans-VariableFont_opsz,wght.ttf', weight: '100 1000', style: 'normal' },
    { path: '../public/fonts/DMSans-Italic-VariableFont_opsz,wght.ttf', weight: '100 1000', style: 'italic' },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dear Friends",
  description: "Collect mailing addresses and send personalized letters",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
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
      <body className={`${ppWriter.variable} ${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
