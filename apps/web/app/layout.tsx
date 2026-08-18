import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { EnsureArtistBridge } from "@/modules/auth/ensure-artist-bridge";
import { StoreProvider } from "@/modules/data/store";
import { AppShell } from "@/modules/shell/app-shell";
import "./globals.css";

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "antiq",
  description: "Fund artists. Explore projects.",
  applicationName: "antiq",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${sans.variable} ${mono.variable}`}>
      <body className="h-full overflow-hidden font-sans antialiased">
        <AuthProvider>
          <StoreProvider>
            <EnsureArtistBridge />
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
