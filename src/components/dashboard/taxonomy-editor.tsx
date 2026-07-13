"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { StoreSettings } from "@/lib/data/store-settings";

export function TaxonomyEditor({
  title,
  description,
  field,
  initialItems,
  settings,
}: {
  title: string;
  description: string;
  field: "categories" | "brands";
  initialItems: string[];
  settings: StoreSettings;
}) {
  const [items, setItems] = useState(initialItems);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const save = async (nextItems: string[]) => {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        [field]: nextItems,
      }),
    });

    if (!response.ok) {
      setMessage("No se pudo guardar.");
      return;
    }

    setItems(nextItems);
    setMessage("Guardado.");
  };

  return (
    <Panel title={title} description={description}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder={`Nueva ${field === "categories" ? "categoría" : "marca"}`} value={value} onChange={(event) => setValue(event.target.value)} />
          <Button
            onClick={() => {
              const nextItems = Array.from(new Set([...items, value.trim()])).filter(Boolean);
              setValue("");
              void save(nextItems);
            }}
          >
            Agregar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
              {item}
              <button
                type="button"
                className="text-zinc-400 transition hover:text-red-300"
                onClick={() => void save(items.filter((current) => current !== item))}
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
      </div>
    </Panel>
  );
}
