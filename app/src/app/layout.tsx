import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
