import type { Metadata } from "next";
import "./globals.css";
import { AccessTracker } from "@/components/access-tracker";
import { MetaPixel } from "@/components/meta-pixel";
import { WhatsAppSupportButton } from "@/components/whatsapp-support-button";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br"),
  title: {
    default: "FechaPro | Sistema de orcamentos e propostas para vender servicos",
    template: "%s | FechaPro",
  },
  description: "Crie orcamentos e propostas comerciais online com link, PDF, aceite, pagamento, portfolio e acompanhamento para vender servicos pelo WhatsApp com mais controle.",
  keywords: [
    "sistema de orcamento",
    "sistema de orcamentos",
    "orcamento online",
    "orcamento para servicos",
    "orcamento pelo whatsapp",
    "proposta comercial online",
    "gerador de proposta comercial",
    "proposta comercial para servicos",
    "proposta de servico",
    "proposta comercial com aceite",
    "software para prestador de servico",
    "vender servicos pelo whatsapp",
    "controle de propostas comerciais",
    "portfolio para proposta",
  ],
  applicationName: "FechaPro",
  authors: [{ name: "FechaPro" }],
  creator: "FechaPro",
  publisher: "FechaPro",
  category: "business",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FechaPro | Sistema de orcamentos e propostas comerciais online",
    description: "Transforme orcamentos do WhatsApp em propostas profissionais com link, PDF, aceite online, pagamento e acompanhamento.",
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
    title: "FechaPro | Sistema de orcamentos e propostas comerciais online",
    description: "Crie propostas profissionais com link, PDF, aceite online, pagamento e acompanhamento para vender servicos.",
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6025997161206513"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <MetaPixel />
        {children}
        <AccessTracker />
        <WhatsAppSupportButton />
      </body>
    </html>
  );
}
