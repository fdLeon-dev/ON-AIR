import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function ContactPage() {
  const storeLocation = process.env.NEXT_PUBLIC_STORE_LOCATION ?? "San Carlos, Maldonado, Uruguay";
  const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE ?? "+598 99 000 000";
  const storeWhatsapp = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "59899000000";
  const transferBank = process.env.NEXT_PUBLIC_TRANSFER_BANK ?? "Banco República (BROU)";
  const transferAccountHolder = process.env.NEXT_PUBLIC_TRANSFER_ACCOUNT_HOLDER ?? "Peak Sport";
  const transferAccountType = process.env.NEXT_PUBLIC_TRANSFER_ACCOUNT_TYPE ?? "Caja de ahorro";
  const transferAccountNumber = process.env.NEXT_PUBLIC_TRANSFER_ACCOUNT_NUMBER ?? "0000000000";
  const transferAlias = process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "PEAK.SPORT";

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Contacto</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Estamos en San Carlos (Maldonado, Uruguay). También podés coordinar por WhatsApp y enviar comprobantes de pago por ese medio.</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-white/10 bg-zinc-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Ubicación y contacto</p>
            <div className="mt-5 space-y-4 text-sm text-zinc-200">
              <p>
                <span className="text-zinc-400">Ubicación:</span> {storeLocation}
              </p>
              <p>
                <span className="text-zinc-400">Teléfono:</span> {storePhone}
              </p>
              <p>
                <span className="text-zinc-400">WhatsApp:</span>{" "}
                <a
                  href={`https://wa.me/${storeWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 underline-offset-4 hover:underline"
                >
                  +{storeWhatsapp}
                </a>
              </p>
              <p className="text-zinc-400">Atención y consultas de pedidos por WhatsApp.</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-zinc-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Datos para transferencia</p>
            <div className="mt-5 space-y-4 text-sm text-zinc-200">
              <p>
                <span className="text-zinc-400">Banco:</span> {transferBank}
              </p>
              <p>
                <span className="text-zinc-400">Titular:</span> {transferAccountHolder}
              </p>
              <p>
                <span className="text-zinc-400">Tipo de cuenta:</span> {transferAccountType}
              </p>
              <p>
                <span className="text-zinc-400">Nro. de cuenta:</span> {transferAccountNumber}
              </p>
              <p>
                <span className="text-zinc-400">Alias:</span> {transferAlias}
              </p>
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-100">
                Luego de transferir, envianos el comprobante por WhatsApp para validar el pago más rápido.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
