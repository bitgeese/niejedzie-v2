import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "niejedzie.pl — Monitor przesiadek PKP",
  description: "Masz przesiadkę? Sprawdzimy czy zdążysz. Monitoring pociągów PKP z powiadomieniami push.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${outfit.variable} ${mono.variable}`}>
      <head>
        <script defer data-domain="niejedzie.pl" src="https://plausible.io/js/script.js"></script>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
