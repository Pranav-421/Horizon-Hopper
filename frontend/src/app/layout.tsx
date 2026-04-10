import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "leaflet/dist/leaflet.css";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const manropeBody = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Horizon Hopper · AI Travel Planner",
  description:
    "Personalized travel planning for Chennai and Chengalpattu. AI-powered itineraries, route suggestions, and curated stays.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${manrope.variable} ${manropeBody.variable}`}>
        {children}
      </body>
    </html>
  );
}
