import type { Metadata } from "next";
import { Aboreto, Space_Grotesk, Space_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const aboreto = Aboreto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-suisse-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Insulindian Miracle Archive",
  description:
    "An editorial archive on city formation, institutional dynamics, and the resource curse across procedurally generated peninsulas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${aboreto.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
