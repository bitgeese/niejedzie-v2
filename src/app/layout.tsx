import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://niejedzie.pl"),
  title: "niejedzie.pl — Monitor przesiadek PKP",
  description: "Masz przesiadkę? Sprawdzimy czy zdążysz. Monitoring pociągów PKP z powiadomieniami push.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://niejedzie.pl",
    siteName: "niejedzie.pl",
    title: "niejedzie.pl — Monitor przesiadek PKP",
    description: "Masz przesiadkę? Sprawdzimy czy zdążysz. Monitoring pociągów PKP z powiadomieniami push.",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "niejedzie.pl — Monitor przesiadek PKP",
    description: "Masz przesiadkę? Sprawdzimy czy zdążysz.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${outfit.variable} ${mono.variable}`}>
      <head>
        <script defer data-domain="niejedzie.pl" src="https://plausible.io/js/script.js"></script>
      </head>
      <body className="font-sans antialiased"><Nav />{children}</body>
    </html>
  );
}
