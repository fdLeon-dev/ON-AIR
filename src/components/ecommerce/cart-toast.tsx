"use client";

import { CheckCircle2 } from "lucide-react";

interface CartToastProps {
  message: string;
  visible: boolean;
}

export function CartToast({ message, visible }: CartToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.2)] backdrop-blur-xl">
      <CheckCircle2 className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}
