import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PromotionsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Promociones</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Landing de campañas, cupones y banners promocionales con un diseño editorial premium.</p>
      </main>
      <Footer />
    </div>
  );
}
