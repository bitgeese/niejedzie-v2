import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "niejedzie.pl — Monitor przesiadek PKP",
  description: "Masz przesiadkę? Sprawdzimy czy zdążysz. Monitoring pociągów PKP z powiadomieniami push.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
