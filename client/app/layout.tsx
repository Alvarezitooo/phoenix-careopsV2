import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhoenixCare",
  description: "L'assistant numérique pour les parents d'enfants en situation de handicap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
