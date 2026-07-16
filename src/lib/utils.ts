import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/types";

const PRODUCTS_BUCKET = "productos";
const STORAGE_PATH_MARKER = `/storage/v1/object/public/${PRODUCTS_BUCKET}/`;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeProductImagePath(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const markerIndex = url.pathname.indexOf(STORAGE_PATH_MARKER);
      if (markerIndex >= 0) {
        return decodeURIComponent(url.pathname.slice(markerIndex + STORAGE_PATH_MARKER.length)).replace(/^\/+/, "");
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }

  if (trimmed.startsWith(`${PRODUCTS_BUCKET}/`)) {
    return trimmed.slice(PRODUCTS_BUCKET.length + 1);
  }

  return trimmed.replace(/^\/+/, "");
}

export function resolveProductImageUrl(value: string) {
  const normalized = normalizeProductImagePath(value);
  if (!normalized) return "";
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) return normalized;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return normalized;

  const encodedPath = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}${STORAGE_PATH_MARKER}${encodedPath}`;
}

export function getProductImages(product: Product) {
  return [product.image1, product.image2, product.image3, product.image4]
    .map((image) => resolveProductImageUrl(image))
    .filter(Boolean);
}
