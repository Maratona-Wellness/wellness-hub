import type { Metadata } from "next";
import { Varela_Round } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const varelaRound = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-varela-round",
});

export const metadata: Metadata = {
  title: "Wellness Hub",
  description: "Plataforma de agendamento de sessões de bem-estar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${varelaRound.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
