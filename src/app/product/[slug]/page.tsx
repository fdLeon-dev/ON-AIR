import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { loadProducts } from "@/lib/data/persistence";
import { ProductDetailClient } from "@/components/ecommerce/product-detail-client";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await loadProducts();
  const product = products.find((entry) => entry.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <ProductDetailClient product={product} />
      </main>
      <Footer />
    </div>
  );
}
