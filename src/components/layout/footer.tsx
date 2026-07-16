import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-4 py-16 text-zinc-400 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-4">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">RUNTIME®</h3>
          <p className="max-w-sm text-sm leading-7">
            Ropa deportiva premium para entrenar con una estética moderna, técnica y minimalista.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white">Navegación</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/catalog" className="hover:text-white">Catálogo</Link></li>
            <li><Link href="/promotions" className="hover:text-white">Promociones</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white">Soporte</h4>
          <ul className="space-y-3 text-sm">
            <li><Link href="/faqs" className="hover:text-white">Preguntas frecuentes</Link></li>
            <li><Link href="/policies" className="hover:text-white">Políticas</Link></li>
            <li><Link href="/account" className="hover:text-white">Mi cuenta</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white">Síguenos</h4>
          <p className="text-sm">Instagram • TikTok • Newsletter</p>
        </div>
      </div>
    </footer>
  );
}
