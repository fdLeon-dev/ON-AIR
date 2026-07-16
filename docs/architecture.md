# RUNTIME® — arquitectura propuesta

## Objetivo
Diseñar una tienda deportiva premium, modular y preparada para producción con Next.js 15, TypeScript, Tailwind, Zustand, Framer Motion y Supabase.

## Decisiones de arquitectura
- App Router: se aprovecha la ruta nativa de Next.js 15 y la separación entre servidor y cliente.
- Feature-first: cada dominio de negocio vive en su propio módulo (catalogo, carrito, checkout, cuenta, admin).
- Componentes reutilizables: header, footer, tarjetas de producto, hero, botones y bloques de contenido son aislados para evitar duplicación.
- Estado global: Zustand gestiona carrito y favoritos sin sobrecargar el árbol de componentes.
- Datos y tipos: los modelos de producto, categoría y reseñas se centralizan para facilitar futuras integraciones con Supabase.
- SEO y rendimiento: metadata, sitemap, robots y optimización de imágenes se incorporan desde el inicio.
- Diseño premium: se trabaja con un sistema visual oscuro por defecto, mucho espacio, tipografía elegante, microinteracciones y componentes con profundidad.

## Estructura de carpetas
src/
  app/
    (marketing)/
    catalog/
    product/[slug]/
    cart/
    checkout/
    account/
    favorites/
    contact/
    faqs/
    policies/
    promotions/
    not-found.tsx
    layout.tsx
    page.tsx
    robots.ts
    sitemap.ts
  components/
    layout/
    ecommerce/
    ui/
  features/
    cart/
    catalog/
    checkout/
    account/
    admin/
  lib/
    data/
    utils/
    supabase/
  stores/
  types/

## Escalabilidad
- La capa de datos puede migrarse a Supabase sin reescribir las pantallas.
- Los componentes UI son compatibles con futuras integraciones de diseño system y CMS.
- El carrito y los favoritos se mantienen separados del render de páginas para facilitar futuras extensiones.
