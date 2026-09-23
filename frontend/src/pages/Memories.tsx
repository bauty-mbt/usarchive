import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useCouple } from "../context/CoupleContext";
import Shell from "../components/Shell";
import EmptyState from "../components/EmptyState";
import type { Memory } from "../types";

export default function Memories() {
  const { myProfileId } = useCouple();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    if (!myProfileId) return;
    const res = await api<{ memories: Memory[] }>(`/memories/profiles/${myProfileId}/memories`);
    setMemories(res.memories);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfileId]);

  return (
    <Shell title="Recuerdos">
      {memories.length === 0 && !showForm ? (
        <EmptyState
          message="Todavía no guardaste ningún recuerdo acá."
          cta="Agregar un recuerdo"
          onCta={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-full border px-4 py-3 text-sm"
              style={{ borderColor: "var(--color-line)" }}
            >
              + Nuevo recuerdo
            </button>
          )}
          {memories.map((m) => (
            <div key={m.id} className="rounded-card border px-4 py-4" style={{ borderColor: "var(--color-line)" }}>
              <p className="font-serif text-lg">{m.title}</p>
              {m.description && <p className="text-sm text-inkMuted mt-1">{m.description}</p>}
              <div className="flex gap-3 mt-2 text-xs text-inkMuted flex-wrap">
                {m.happenedAt && <span>{new Date(m.happenedAt).toLocaleDateString("es-AR")}</span>}
                {m.location && <span>📍 {m.location}</span>}
                {m.song && <span>🎵 {m.song}</span>}
                {m.emotion && <span>{m.emotion}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && myProfileId && (
        <NewMemoryForm
          profileId={myProfileId}
          onDone={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Shell>
  );
}

function NewMemoryForm({
  profileId,
  onDone,
  onCancel,
}: {
  profileId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [happenedAt, setHappenedAt] = useState("");
  const [location, setLocation] = useState("");
  const [song, setSong] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/memories/profiles/${profileId}/memories`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || undefined,
          happenedAt: happenedAt || undefined,
          location: location || undefined,
          song: song || undefined,
        }),
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-card border px-4 py-4" style={{ borderColor: "var(--color-line)" }}>
      <input
        required
        autoFocus
        placeholder="Ej: La noche que hablamos hasta las 4 AM"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
        style={{ borderColor: "var(--color-line)" }}
      />
      <textarea
        placeholder="Contalo"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent resize-none"
        style={{ borderColor: "var(--color-line)" }}
      />
      <input
        type="date"
        value={happenedAt}
        onChange={(e) => setHappenedAt(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
        style={{ borderColor: "var(--color-line)" }}
      />
      <input
        placeholder="Lugar (opcional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
        style={{ borderColor: "var(--color-line)" }}
      />
      <input
        placeholder="Canción asociada (opcional)"
        value={song}
        onChange={(e) => setSong(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
        style={{ borderColor: "var(--color-line)" }}
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-full border px-4 py-3 text-sm" style={{ borderColor: "var(--color-line)" }}>
          Cancelar
        </button>
        <button disabled={submitting || !title.trim()} className="flex-1 rounded-full bg-accent px-4 py-3 text-sm text-surface disabled:opacity-50">
          {submitting ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
