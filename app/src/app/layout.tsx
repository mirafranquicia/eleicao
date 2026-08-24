import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Base para as URLs absolutas de og:image etc. (produção > URL da Vercel > dev)
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "VotoCard — Sua foto de perfil eleitoral em 30 segundos",
  description:
    "Declare seu voto com estilo: molduras personalizadas sobre a sua própria foto, direto no navegador. Sua foto não sai do seu celular. Eleições 2026.",
  openGraph: {
    title: "VotoCard — Molduras Eleitorais 2026",
    description:
      "Crie sua foto de perfil, story e post declarando seu voto. Grátis, em 30 segundos, sem enviar sua foto para lugar nenhum.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
