import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Akademi Sepak Bola Surabaya`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "UNESA FC Academy", "UNESA FC", "akademi sepak bola", "sekolah sepak bola", "SSB Surabaya",
    "akademi sepak bola Surabaya", "Universitas Negeri Surabaya", "sepak bola usia muda", "pembinaan pemain muda",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "sports",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Akademi Sepak Bola Surabaya`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/brand/logo.png", alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/brand/logo.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: false },
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
          <script
            type="application/ld+json"
            // Data terstruktur: organisasi olahraga + situs
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "SportsOrganization",
                    "@id": `${SITE_URL}/#org`,
                    name: SITE_NAME,
                    alternateName: "UNESA FC",
                    sport: "Soccer",
                    url: SITE_URL,
                    logo: `${SITE_URL}/brand/logo.png`,
                    description: SITE_DESCRIPTION,
                    address: { "@type": "PostalAddress", addressLocality: "Surabaya", addressRegion: "Jawa Timur", addressCountry: "ID" },
                  },
                  { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, inLanguage: "id-ID", publisher: { "@id": `${SITE_URL}/#org` } },
                ],
              }),
            }}
          />
          {children}
          <RegisterSW />
        </body>
      </html>
    </ClerkProvider>
  );
}
