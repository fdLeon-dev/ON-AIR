export type ProductCategory =
  | "Conjuntos deportivos"
  | "Buzos"
  | "Medias anti deslizante"
  | "Camperas"
  | "Remeras"
  | "Shorts"
  | "Accesorios";

export type ProductStatus = "Nuevo" | "Destacado" | "Oferta" | "Popular";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  offerPrice?: number;
  description: string;
  longDescription: string;
  features: string[];
  sizes: string[];
  sizeStock?: Record<string, number>;
  colors: string[];
  image1: string;
  image2: string;
  image3: string;
  image4: string;
  stock: number;
  tags: string[];
  status: ProductStatus;
  material: string;
  fabricDetails?: string;
  print?: string;
  style?: string;
  weight: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: ProductCategory;
  description: string;
  image: string;
}

export interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
}

export interface HeroCarouselSideConfig {
  images: string[];
  enabled: boolean;
  autoplay: boolean;
  infinite: boolean;
  pauseOnHover: boolean;
  transition: "fade" | "slide";
  interval: number;
  transitionDuration: number;
}

export interface HeroConfig {
  leftCarousel: HeroCarouselSideConfig;
  rightCarousel: HeroCarouselSideConfig;
}
