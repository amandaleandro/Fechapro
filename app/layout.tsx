import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FechaPro",
  description: "Crie propostas comerciais bonitas com orcamento, portfolio e botao de aceite.",
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
