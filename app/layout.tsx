import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NomadMail",
  description: "Collect mailing addresses and send personalized letters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
