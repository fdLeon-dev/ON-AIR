import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Preguntas frecuentes</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Sección preparada para FAQs, políticas de devolución, envíos y soporte comercial.</p>
      </main>
      <Footer />
    </div>
  );
}
