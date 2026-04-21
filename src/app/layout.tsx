import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "BNI Route Connect — Find BNI Members Along Your Route",
  description: "Discover 61,500+ BNI members across 1,584 chapters in India. Find chapters on your travel route, search members by profession, and explore 153 regions.",
  keywords: "BNI, Business Network International, India, networking, chapters, members, route, connect",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
