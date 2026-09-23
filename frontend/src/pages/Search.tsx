import { useState } from "react";
import { api } from "../api/client";
import { useCouple } from "../context/CoupleContext";
import Shell from "../components/Shell";
import type { KnowledgeEntry, Memory } from "../types";

export default function Search() {
  const { myProfileId } = useCouple();
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searched, setSearched] = useState(false);

  async function runSearch(value: string) {
    setQ(value);
    if (!myProfileId || value.trim().length < 2) {
      setSearched(false);
      return;
    }
    const res = await api<{ entries: KnowledgeEntry[]; memories: Memory[] }>(
      `/search?profileId=${myProfileId}&q=${encodeURIComponent(value)}`
    );
    setEntries(res.entries);
    setMemories(res.memories);
    setSearched(true);
  }

  return (
    <Shell title="Buscar">
      <input
        autoFocus
        placeholder='Ej: "flores"'
        value={q}
        onChange={(e) => runSearch(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent mb-4"
        style={{ borderColor: "var(--color-line)" }}
      />

      {searched && entries.length === 0 && memories.length === 0 && (
        <p className="text-sm text-inkMuted">Nada por ahora con "{q}".</p>
      )}

      {entries.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-inkMuted mb-2">Conocimiento</p>
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-card border px-4 py-3" style={{ borderColor: "var(--color-line)" }}>
                <p className="text-sm">
                  {e.category.icon} <span className="font-medium">{e.title}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {memories.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-inkMuted mb-2">Recuerdos</p>
          <div className="space-y-2">
            {memories.map((m) => (
              <div key={m.id} className="rounded-card border px-4 py-3" style={{ borderColor: "var(--color-line)" }}>
                <p className="text-sm font-medium">📸 {m.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
