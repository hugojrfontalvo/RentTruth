import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { getAppUrlObject } from "@/lib/app-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getAppUrlObject(),
  title: "RentTruth",
  description: "Track repairs, build trust, and improve rental living.",
  openGraph: {
    title: "RentTruth",
    description: "Track repairs, build trust, and improve rental living.",
    url: "/",
    siteName: "RentTruth",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
