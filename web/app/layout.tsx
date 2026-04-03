import type { Metadata } from "next";
import localFont from "next/font/local";
import { Aboreto } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const aboreto = Aboreto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const suisse = localFont({
  src: [
    {
      path: "../public/fonts/suisse/suisse-book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/suisse/suisse-book-italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/suisse/suisse-medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-suisse",
  display: "swap",
});

const suisseMono = localFont({
  src: [
    {
      path: "../public/fonts/suisse-mono/suisse-mono.otf",
      weight: "400",
      style: "normal",
    },
  ],
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
      className={`${aboreto.variable} ${suisse.variable} ${suisseMono.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
