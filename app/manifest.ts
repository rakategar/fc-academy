import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UNESA FC Academy",
    short_name: "UNESA FC",
    description: "Absensi, performa, dan laporan pemain UNESA FC Academy",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1b47",
    theme_color: "#0a1b47",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Absensi", url: "/coach/absensi", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Beranda pemain", url: "/pemain", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
