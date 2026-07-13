import type { ReactNode } from "react";
import { cn, formatCurrency } from "@/lib/utils";

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.24)]", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  helpText,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  helpText?: string;
  tone?: "neutral" | "emerald" | "amber" | "sky" | "rose";
}) {
  const toneClasses: Record<"neutral" | "emerald" | "amber" | "sky" | "rose", string> = {
    neutral: "from-white/10 to-white/5 text-white",
    emerald: "from-emerald-500/25 to-emerald-500/5 text-emerald-100",
    amber: "from-amber-500/25 to-amber-500/5 text-amber-100",
    sky: "from-sky-500/25 to-sky-500/5 text-sky-100",
    rose: "from-rose-500/25 to-rose-500/5 text-rose-100",
  };

  return (
    <div className={cn("rounded-[1.75rem] border border-white/10 bg-gradient-to-br p-5", toneClasses[tone])}>
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {helpText ? <p className="mt-2 text-sm text-white/60">{helpText}</p> : null}
    </div>
  );
}

export function formatDelta(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export { formatCurrency };
