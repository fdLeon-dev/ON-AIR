"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types";
import { CartToast } from "@/components/ecommerce/cart-toast";

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  label?: ReactNode;
}

export function AddToCartButton({ product, className, label = "Agregar al carrito" }: AddToCartButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    addItem({
      id: product.id,
      name: product.name,
      price: product.offerPrice ?? product.price,
      image: product.image1 || product.image2 || product.image3 || product.image4,
      quantity: 1,
    });

    setVisible(true);
    window.setTimeout(() => {
      router.push("/cart");
    }, 250);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAddToCart}
        className={className}
      >
        {label}
      </button>
      <CartToast message={`${product.name} agregado al carrito`} visible={visible} />
    </>
  );
}
