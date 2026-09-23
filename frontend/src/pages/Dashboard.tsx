import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useCouple } from "../context/CoupleContext";
import Shell from "../components/Shell";
import DiscoverModal from "../components/DiscoverModal";
import type { KnowledgeCategory } from "../types";

export default function Dashboard() {
  const { myProfileId, partnerNickname } = useCouple();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!myProfileId) return;
    setLoading(true);
    const [catRes, scoreRes] = await Promise.all([
      api<{ categories: KnowledgeCategory[] }>(`/knowledge/profiles/${myProfileId}/categories`),
      api<{ score: number }>(`/search/knowledge-score/${myProfileId}`),
    ]);
    setCategories(catRes.categories);
    setScore(scoreRes.score);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfileId]);

  const totalEntries = categories.reduce((sum, c) => sum + c._count.entries, 0);

  return (
    <Shell>
      <div className="pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] md:pt-10 md:pl-24">
        <p className="text-xs uppercase tracking-[0.2em] text-inkMuted">Tu mapa de</p>
        <h1 className="font-serif text-3xl md:text-4xl mb-1">
          {partnerNickname ?? "tu persona"}
        </h1>
        {score !== null && (
          <p className="text-sm text-inkMuted mb-6">
            {totalEntries === 0
              ? "Todavía hay zonas por descubrir."
              : `${score}% explorado · ${totalEntries} descubrimientos guardados`}
          </p>
        )}

        {!loading && categories.length === 0 && (
          <p className="text-sm text-inkMuted">Preparando tu espacio…</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="rounded-card border px-4 py-5 text-left transition-transform active:scale-[0.97] relative overflow-hidden"
              style={{ borderColor: "var(--color-line)", background: "var(--color-surface-alt)" }}
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="font-serif text-base mt-2">{cat.label}</p>
              <p className="text-xs text-inkMuted mt-0.5">
                {cat._count.entries === 0 ? "vacío todavía" : `${cat._count.entries} guardado${cat._count.entries === 1 ? "" : "s"}`}
              </p>
              {cat._count.entries === 0 && (
                <span
                  className="absolute right-3 top-3 h-2 w-2 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowDiscover(true)}
        className="fixed bottom-24 right-5 md:bottom-10 md:right-10 z-30 rounded-full bg-accent px-5 py-3.5 text-sm text-surface shadow-lg"
      >
        + Descubrí algo
      </button>

      {showDiscover && myProfileId && (
        <DiscoverModal
          profileId={myProfileId}
          categories={categories}
          onClose={() => setShowDiscover(false)}
          onCreated={load}
        />
      )}
    </Shell>
  );
}
