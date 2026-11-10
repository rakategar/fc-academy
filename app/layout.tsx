import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "UNESA FC Academy", template: "%s · UNESA FC Academy" },
  description: "Dashboard manajemen klub UNESA FC Academy: absensi, performa, dan laporan pemain.",
  applicationName: "UNESA FC Academy",
  appleWebApp: { capable: true, title: "UNESA FC", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a1b47",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#0b2a6f", fontFamily: "var(--font-archivo)", borderRadius: "8px" },
      }}
    >
      <html lang="id" className={`${archivo.variable} ${jetbrains.variable}`}>
        <body className="min-h-dvh">
          {children}
          <RegisterSW />
        </body>
      </html>
    </ClerkProvider>
  );
}
