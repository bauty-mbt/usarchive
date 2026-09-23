import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useCouple } from "../context/CoupleContext";
import Shell from "../components/Shell";
import EmptyState from "../components/EmptyState";
import DiscoverModal from "../components/DiscoverModal";
import { confidenceMeta } from "../types";
import type { KnowledgeCategory, KnowledgeEntry } from "../types";

export default function CategoryView() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { myProfileId } = useCouple();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [showDiscover, setShowDiscover] = useState(false);

  async function load() {
    if (!myProfileId || !categoryId) return;
    const [entriesRes, catsRes] = await Promise.all([
      api<{ entries: KnowledgeEntry[] }>(`/knowledge/profiles/${myProfileId}/entries?categoryId=${categoryId}`),
      api<{ categories: KnowledgeCategory[] }>(`/knowledge/profiles/${myProfileId}/categories`),
    ]);
    setEntries(entriesRes.entries);
    setCategories(catsRes.categories);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfileId, categoryId]);

  const category = categories.find((c) => c.id === categoryId);

  async function removeEntry(id: string) {
    await api(`/knowledge/entries/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Shell>
      <div className="pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] md:pt-10 md:pl-24">
        <button onClick={() => navigate(-1)} className="text-sm text-inkMuted mb-3">
          ← volver
        </button>
        <h1 className="font-serif text-3xl mb-6">
          {category ? `${category.icon} ${category.label}` : "Cargando…"}
        </h1>

        {entries.length === 0 ? (
          <EmptyState
            message="Este espacio todavía está vacío. Quizás hoy descubras algo nuevo."
            cta="Descubrí algo"
            onCta={() => setShowDiscover(true)}
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-card border px-4 py-4"
                style={{ borderColor: "var(--color-line)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg">{entry.title}</p>
                    {entry.description && (
                      <p className="text-sm text-inkMuted mt-1">{entry.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs rounded-full px-2 py-1"
                    style={{ background: "var(--color-accent-soft)" }}>
                    {confidenceMeta[entry.confidence].icon}
                  </span>
                </div>

                {entry.reasonToRemember && (
                  <p className="text-xs italic text-inkMuted mt-2">“{entry.reasonToRemember}”</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1 flex-wrap">
                    {entry.tags.map(({ tag }) => (
                      <span key={tag.id} className="text-[11px] text-inkMuted">
                        #{tag.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{"★".repeat(entry.importance)}</span>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-xs text-inkMuted underline underline-offset-2"
                    >
                      eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowDiscover(true)}
              className="w-full rounded-full border px-4 py-3 text-sm mt-2"
              style={{ borderColor: "var(--color-line)" }}
            >
              + Agregar otro descubrimiento
            </button>
          </div>
        )}
      </div>

      {showDiscover && myProfileId && (
        <DiscoverModal
          profileId={myProfileId}
          categories={categories}
          defaultCategoryId={categoryId}
          onClose={() => setShowDiscover(false)}
          onCreated={load}
        />
      )}
    </Shell>
  );
}
