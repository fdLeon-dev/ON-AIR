import { UserCircle2 } from "lucide-react";
import { Panel } from "@/components/dashboard/dashboard-ui";
import { resolveAdminAccess } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const { user, profile, isAdmin } = await resolveAdminAccess();

  if (!user) {
    return null;
  }

  return (
    <Panel title="Perfil del administrador" description="Datos de sesión y permisos activos.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400/15 text-emerald-200">
          <UserCircle2 className="h-8 w-8" />
        </div>
        <div>
          <p className="text-xl font-semibold">{profile?.full_name ?? user.email ?? "Administrador"}</p>
          <p className="text-sm text-zinc-400">{user.email ?? "Sin email"}</p>
          <p className="mt-1 text-sm text-zinc-300">{isAdmin ? "Permisos de administrador activos." : "Sin permisos de administrador."}</p>
        </div>
      </div>
    </Panel>
  );
}
