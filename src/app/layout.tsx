import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupabaseSyncProvider } from "@/components/providers/supabase-sync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peak Sport | Ropa deportiva premium",
  description: "Tienda deportiva premium con performance, estilo urbano y experiencias de compra modernas.",
  metadataBase: new URL("https://peak-sport.example"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-black text-white">
        <SupabaseSyncProvider>{children}</SupabaseSyncProvider>
      </body>
    </html>
  );
}
