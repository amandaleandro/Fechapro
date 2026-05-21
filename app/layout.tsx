import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AccessTracker } from "@/components/access-tracker";
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br"),
  title: {
    default: "FechaPro | Propostas comerciais online para fechar mais serviços",
    template: "%s | FechaPro",
  },
  description: "Pare de enviar orçamentos simples que derrubam seu valor. Crie propostas comerciais online com portfólio, PDF, aceite e cobrança para fechar mais serviços.",
  keywords: [
    "proposta comercial online",
    "gerador de proposta comercial",
    "orçamento online",
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
    title: "FechaPro | Propostas comerciais online para fechar mais serviços",
    description: "Transforme orçamentos improvisados em propostas profissionais com valor, prazo, portfólio, depoimentos, PDF e botão de aceite.",
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
    title: "FechaPro | Propostas comerciais online para fechar mais",
    description: "Pare de vender serviço com orçamento simples. Envie uma proposta profissional com PDF, portfólio e aceite.",
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
