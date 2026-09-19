import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Área do Associado — ASCEA",
  description:
    "Associação Sul Catarinense de Engenheiros e Arquitetos — carteirinha digital, convênios e cadastro do associado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
