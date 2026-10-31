import type { Metadata } from "next";
import "./v4/v4.css";

const title = "Endless Wake V4: Living Tides";
const description = "Sail an open sea, fish, trade, dock at island harbors, and defend your ship against black sails and sea monsters.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Endless Wake",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    siteName: "Endless Wake",
    locale: "en_US",
    type: "website",
    images: [{ url: "/v4-social-preview.jpg", width: 1672, height: 941, alt: "A sailing ship approaches an island harbor" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/v4-social-preview.jpg"],
  },
  other: {
    "theme-color": "#062b3b",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
