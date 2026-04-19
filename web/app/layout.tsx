import type { Metadata } from "next";
import "@fontsource/aboreto/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-mono/400.css";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

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
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
