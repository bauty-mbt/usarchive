import { FormEvent, useState } from "react";
import { api } from "../api/client";
import type { KnowledgeCategory, Confidence } from "../types";
import { confidenceMeta } from "../types";

export default function DiscoverModal({
  profileId,
  categories,
  defaultCategoryId,
  onClose,
  onCreated,
}: {
  profileId: string;
  categories: KnowledgeCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [confidence, setConfidence] = useState<Confidence>("ASSUMED");
  const [importance, setImportance] = useState(3);
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/knowledge/profiles/${profileId}/entries`, {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          title,
          description: description || undefined,
          reasonToRemember: reason || undefined,
          confidence,
          importance,
          tags: tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      onCreated();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-0 md:px-6">
      <div
        className="w-full md:max-w-md max-h-[90vh] overflow-y-auto rounded-t-[28px] md:rounded-card bg-surface px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full md:hidden" style={{ background: "var(--color-line)" }} />
        <h2 className="font-serif text-2xl mb-1">¿Qué descubriste?</h2>
        <p className="text-sm text-inkMuted mb-5">Capturalo antes de que se te escape.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="scroll-x flex gap-2 pb-1">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap"
                style={{
                  borderColor: categoryId === c.id ? "var(--color-accent)" : "var(--color-line)",
                  background: categoryId === c.id ? "var(--color-accent-soft)" : "transparent",
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <input
            required
            autoFocus
            placeholder="Ej: Le encanta esta canción"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
            style={{ borderColor: "var(--color-line)" }}
          />
          <textarea
            placeholder="Contá un poco más (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent resize-none"
            style={{ borderColor: "var(--color-line)" }}
          />
          <input
            placeholder="¿Por qué querés recordarlo? (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
            style={{ borderColor: "var(--color-line)" }}
          />
          <input
            placeholder="Etiquetas separadas por coma"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
            style={{ borderColor: "var(--color-line)" }}
          />

          <div>
            <p className="text-xs text-inkMuted mb-1.5">¿Qué tan seguro estás?</p>
            <div className="scroll-x flex gap-2">
              {(Object.keys(confidenceMeta) as Confidence[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setConfidence(key)}
                  className="shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap"
                  style={{
                    borderColor: confidence === key ? "var(--color-accent)" : "var(--color-line)",
                    background: confidence === key ? "var(--color-accent-soft)" : "transparent",
                  }}
                >
                  {confidenceMeta[key].icon} {confidenceMeta[key].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-inkMuted mb-1.5">Importancia</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setImportance(n)}
                  className="text-xl leading-none"
                >
                  {n <= importance ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border px-4 py-3 text-sm"
              style={{ borderColor: "var(--color-line)" }}
            >
              Cancelar
            </button>
            <button
              disabled={submitting || !title.trim() || !categoryId}
              className="flex-1 rounded-full bg-accent px-4 py-3 text-sm text-surface disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
