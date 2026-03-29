import type { Metadata } from "next";
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
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-text font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
