import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AccessTracker } from "@/components/access-tracker";
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br"),
  title: {
    default: "FechaPro | Estrutura comercial para vender serviços melhor",
    template: "%s | FechaPro",
  },
  description: "Apresente, envie e acompanhe propostas profissionais com marca, portfólio, PDF, link, aceite online e apoio para vender serviços com mais confiança.",
  keywords: [
    "proposta comercial online",
    "gerador de proposta comercial",
    "estrutura comercial para prestador de serviço",
    "proposta de serviço",
    "proposta comercial com aceite",
    "software para prestador de serviço",
    "portfólio para proposta",
  ],
  applicationName: "FechaPro",
  authors: [{ name: "FechaPro" }],
  creator: "FechaPro",
  publisher: "FechaPro",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FechaPro | Estrutura comercial para vender serviços melhor",
    description: "Transforme sua apresentação comercial com propostas profissionais, portfólio, PDF, link, aceite online e acompanhamento.",
    url: "/",
    siteName: "FechaPro",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/landing/hero-proposta.png",
        width: 1200,
        height: 630,
        alt: "Exemplo de proposta comercial online criada no FechaPro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FechaPro | Estrutura comercial para vender serviços melhor",
    description: "Apresente valor com propostas profissionais, portfólio, PDF, link, aceite online e acompanhamento.",
    images: ["/landing/hero-proposta.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="google-adsense-account" content="ca-pub-6025997161206513" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6025997161206513"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
        <AccessTracker />
        <WhatsAppSupportButton />
      </body>
    </html>
  );
}
