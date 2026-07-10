import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">404</p>
      <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">No encontramos esa página</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">La ruta que buscás no está disponible, pero podés volver al inicio o explorar la colección premium.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">
        Volver al inicio
      </Link>
    </div>
  );
}
