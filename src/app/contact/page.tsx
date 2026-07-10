import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Contacto</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Canal de soporte, WhatsApp, email y formulario profesional para atención al cliente.</p>
      </main>
      <Footer />
    </div>
  );
}
