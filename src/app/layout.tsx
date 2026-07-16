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
  applicationName: "RUNTIME®",
  title: "RUNTIME® | Indumentaria Deportiva Premium",
  description: "RUNTIME® ofrece indumentaria deportiva premium con diseño tecnico, estilo urbano y una experiencia de compra moderna.",
  metadataBase: new URL("https://runtime.example"),
  openGraph: {
    title: "RUNTIME® | Indumentaria Deportiva Premium",
    description: "Descubre la nueva coleccion de RUNTIME®: performance, diseno premium y tecnologia textil para entrenar y moverte mejor.",
    type: "website",
    url: "https://runtime.example",
    siteName: "RUNTIME®",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUNTIME® | Indumentaria Deportiva Premium",
    description: "RUNTIME®: ropa deportiva premium con enfoque tecnico y estetica urbana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RUNTIME®",
    url: "https://runtime.example",
    email: "support@runtime.example",
    description: "Marca de indumentaria deportiva premium con foco en rendimiento y estilo urbano.",
  };

  return (
    <html lang="es" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-black text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SupabaseSyncProvider>{children}</SupabaseSyncProvider>
      </body>
    </html>
  );
}
