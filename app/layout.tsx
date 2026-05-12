import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br"),
  title: {
    default: "FechaPro | Propostas comerciais online para fechar servicos",
    template: "%s | FechaPro",
  },
  description: "Crie propostas comerciais online com portfolio, PDF, aceite do cliente e cobranca. Feito para prestadores de servico venderem com mais profissionalismo.",
  keywords: [
    "proposta comercial online",
    "gerador de proposta comercial",
    "orcamento online",
    "proposta de servico",
    "proposta comercial com aceite",
    "software para prestador de servico",
    "portfolio para proposta",
  ],
  applicationName: "FechaPro",
  authors: [{ name: "FechaPro" }],
  creator: "FechaPro",
  publisher: "FechaPro",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FechaPro | Propostas comerciais online para fechar servicos",
    description: "Monte propostas com valor, prazo, portfolio, depoimentos, PDF e botao de aceite em um link profissional.",
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
    title: "FechaPro | Propostas comerciais online",
    description: "Crie links profissionais de proposta com PDF, portfolio e aceite do cliente.",
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
      <body>{children}</body>
    </html>
  );
}
