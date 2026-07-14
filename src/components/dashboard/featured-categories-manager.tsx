"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  GripVertical,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { FeaturedCategory } from "@/types";

const FIELD_CLASSNAME = "w-full rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validateCategories(categories: FeaturedCategory[]) {
  const duplicateSlug = categories
    .map((category) => category.slug.trim().toLowerCase())
    .filter(Boolean)
    .reduce<Record<string, number>>((acc, slug) => {
      acc[slug] = (acc[slug] ?? 0) + 1;
      return acc;
    }, {});

  for (const category of categories) {
    if (!category.name.trim()) return "Cada categoría debe tener un nombre.";
    if (!category.description.trim()) return "Cada categoría debe tener una descripción.";
    if (!category.imageUrl.trim()) return "Cada categoría debe tener una URL de imagen.";
    if (!category.slug.trim()) return "Cada categoría debe tener un slug válido.";
    if (duplicateSlug[category.slug.trim().toLowerCase()] > 1) return "Los slugs deben ser únicos.";
  }

  return null;
}

export function FeaturedCategoriesManager({ initialCategories }: { initialCategories: FeaturedCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
  }>({
    id: "",
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => a.displayOrder - b.displayOrder),
    [categories],
  );

  const resetForm = () => {
    setForm({ id: "", name: "", slug: "", description: "", imageUrl: "", isActive: true });
    setError(null);
    setMessage(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "El nombre es obligatorio.";
    if (!form.description.trim()) return "La descripción es obligatoria.";
    if (!form.imageUrl.trim()) return "La URL de la imagen es obligatoria.";
    try {
      const parsed = new URL(form.imageUrl);
      if (!parsed.protocol.startsWith("http")) return "La URL de la imagen debe comenzar con http o https.";
    } catch {
      return "La URL de la imagen no es válida.";
    }
    return null;
  };

  const persistCategories = async (nextCategories: FeaturedCategory[]) => {
    const validationError = validateCategories(nextCategories);
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return false;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/featured-categories", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: nextCategories }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "No se pudo guardar la configuración.");
      }

      setCategories(nextCategories);
      setMessage("Cambios guardados correctamente.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    const now = new Date().toISOString();
    const slug = form.slug.trim() ? slugify(form.slug.trim()) : slugify(form.name.trim());
    const nextCategory: FeaturedCategory = {
      id: form.id || crypto.randomUUID(),
      name: form.name.trim(),
      slug,
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      displayOrder: categories.length,
      isActive: form.isActive,
      createdAt: form.id ? categories.find((item) => item.id === form.id)?.createdAt ?? now : now,
      updatedAt: now,
    };

    const remaining = categories.filter((category) => category.id !== nextCategory.id);
    const nextCategories = [...remaining, nextCategory]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category, index) => ({ ...category, displayOrder: index }));

    const listValidationError = validateCategories(nextCategories);
    if (listValidationError) {
      setError(listValidationError);
      setMessage(null);
      return;
    }

    const saved = await persistCategories(nextCategories);
    if (saved) resetForm();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("¿Eliminar esta categoría destacada?")) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/featured-categories", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "No se pudo eliminar la categoría.");
      }

      setCategories((current) => current.filter((category) => category.id !== id).map((category, index) => ({ ...category, displayOrder: index })));
      setMessage("Categoría eliminada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: FeaturedCategory) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
    });
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveCategory = async (sourceId: string, targetId: string) => {
    const sourceIndex = orderedCategories.findIndex((category) => category.id === sourceId);
    const targetIndex = orderedCategories.findIndex((category) => category.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextCategories = [...orderedCategories];
    const [moved] = nextCategories.splice(sourceIndex, 1);
    nextCategories.splice(targetIndex, 0, moved);

    const updated = nextCategories.map((category, index) => ({ ...category, displayOrder: index }));
    await persistCategories(updated);
  };

  return (
    <Panel title="Categorías destacadas" description="Gestiona las colecciones que aparecen en la página principal." className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-white">Agregar / editar categoría</p>
              <p className="mt-1 text-sm text-zinc-400">Llena los campos y guarda para actualizar la colección destacada.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={resetForm}>
              <RefreshCw className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>

          <div className="grid gap-4">
            <input
              value={form.name}
              onChange={(event) => {
                const nextName = event.target.value;
                setForm((current) => ({
                  ...current,
                  name: nextName,
                  slug: current.id ? current.slug : slugify(nextName),
                }));
              }}
              className={FIELD_CLASSNAME}
              placeholder="Nombre"
            />
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              className={FIELD_CLASSNAME}
              placeholder="Slug (ej. conjuntos-deportivos)"
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className={`${FIELD_CLASSNAME} min-h-[7rem] resize-none`}
              placeholder="Descripción"
            />
            <input
              value={form.imageUrl}
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
              className={FIELD_CLASSNAME}
              placeholder="URL pública de la imagen"
            />
            <label className="inline-flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Activa la categoría en el sitio
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={handleSaveCategory} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" /> {form.id ? "Actualizar" : "Crear"}
            </Button>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">Orden y estado</p>
                <p className="mt-1 text-sm text-zinc-400">Arrastra las categorías para cambiar su orden en la página principal.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-zinc-400">
                {orderedCategories.length} ítems
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {orderedCategories.map((category) => (
              <article
                key={category.id}
                draggable
                onDragStart={() => setDraggedId(category.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId && draggedId !== category.id) {
                    void moveCategory(draggedId, category.id);
                  }
                }}
                className="group cursor-grab rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-zinc-900 text-zinc-400">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{category.name}</p>
                    <p className="truncate text-sm text-zinc-400">{category.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>{category.isActive ? "Activo" : "Inactivo"}</span>
                    <Button size="sm" variant="secondary" onClick={() => handleEditCategory(category)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void handleDeleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}
