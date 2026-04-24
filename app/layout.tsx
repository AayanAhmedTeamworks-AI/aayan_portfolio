import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MeanderLoader } from "@/components/meander-loader";
import { LenisRoot } from "@/components/lenis-root";
import { Cursor } from "@/components/cursor";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Codex Ahmed — Syed Aayan Ahmed",
  description:
    "Engineer of durable AI systems. Friedberg · Ingolstadt · MMXXVI. Work on LLM orchestration, offline-first PWAs, and workflow automation for DACH SMEs.",
  metadataBase: new URL("https://codex-ahmed.vercel.app"),
  openGraph: {
    title: "Codex Ahmed",
    description: "Engineer of durable AI systems.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${cormorant.variable}`}
    >
      <body className="min-h-dvh bg-canvas text-ink font-sans antialiased grain-overlay">
        <LenisRoot>
          <Cursor />
          <MeanderLoader />
          <Nav />
          {children}
          <Footer />
        </LenisRoot>
      </body>
    </html>
  );
}
