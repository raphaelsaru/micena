import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Toaster } from "sonner";
import { MensalistasNotificationsProvider } from "@/contexts/MensalistasNotificationsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationWrapper } from "@/components/NavigationWrapper";

// Forçar todas as páginas a serem dinâmicas
export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Micena Piscinas - Sistema de Gestão",
  description: "Sistema completo para gerenciamento de clientes, serviços e rotas de piscinas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <MensalistasNotificationsProvider>
            <NavigationWrapper />
            <main className="bg-gray-50">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </MensalistasNotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
