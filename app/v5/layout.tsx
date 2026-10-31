import type { Metadata } from "next";
import { headers } from "next/headers";
import "../voxel/voxel.css";

const title = "Endless Wake V5: Voxel Archipelago";
const description = "Sail a voxel archipelago, salvage cargo, fish, visit harbors, and watch volcanoes reshape the shore.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost";
  const safeHost = /^[a-z0-9.:[\]-]+$/i.test(forwardedHost) ? forwardedHost : "localhost";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : safeHost.startsWith("localhost")
      ? "http"
      : "https";
  const image = new URL("/voxel-social-preview.jpg", protocol + "://" + safeHost).toString();
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Endless Wake",
      locale: "en_US",
      type: "website",
      images: [{ url: image, width: 1672, height: 941, alt: "A voxel sailing ship approaches a volcanic island" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "theme-color": "#052c38",
    },
  };
}

export default function V5Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
