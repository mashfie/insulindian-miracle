import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insulindian Miracle",
  description: "MAB policy simulation on procedurally generated peninsulas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${GeistMono.variable}`}>
      <body className="bg-void text-text font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
