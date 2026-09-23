import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import Shell from "../components/Shell";
import EmptyState from "../components/EmptyState";
import type { TimelineEvent } from "../types";

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await api<{ events: TimelineEvent[] }>("/timeline");
    setEvents(res.events);
  }

  useEffect(() => {
    load();
  }, []);

  const byYear = events.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const year = new Date(ev.eventDate).getFullYear().toString();
    (acc[year] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <Shell title="Timeline">
      {events.length === 0 && !showForm ? (
        <EmptyState
          message="Todavía no armaron su línea de tiempo."
          cta="Agregar un momento"
          onCta={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-8">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-full border px-4 py-3 text-sm"
              style={{ borderColor: "var(--color-line)" }}
            >
              + Nuevo momento
            </button>
          )}
          {Object.entries(byYear).map(([year, evs]) => (
            <div key={year}>
              <p className="font-serif text-xl mb-3">{year}</p>
              <div className="border-l pl-4 space-y-4" style={{ borderColor: "var(--color-line)" }}>
                {evs.map((ev) => (
                  <div key={ev.id} className="relative">
                    <span
                      className="absolute -left-[22px] top-1 h-2.5 w-2.5 rounded-full"
                      style={{ background: "var(--color-accent)" }}
                    />
                    <p className="text-sm">
                      {ev.icon} <span className="font-medium">{ev.title}</span>
                    </p>
                    {ev.description && <p className="text-xs text-inkMuted mt-0.5">{ev.description}</p>}
                    <p className="text-[11px] text-inkMuted mt-0.5">
                      {new Date(ev.eventDate).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NewEventForm
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

function NewEventForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [icon, setIcon] = useState("⭐");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/timeline", {
        method: "POST",
        body: JSON.stringify({ title, description: description || undefined, eventDate, icon }),
      });
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-card border px-4 py-4" style={{ borderColor: "var(--color-line)" }}>
      <div className="flex gap-2">
        {["⭐", "💬", "🎵", "❤️", "🎂", "📸"].map((e) => (
          <button
            type="button"
            key={e}
            onClick={() => setIcon(e)}
            className="rounded-full border px-3 py-2 text-lg"
            style={{ borderColor: icon === e ? "var(--color-accent)" : "var(--color-line)" }}
          >
            {e}
          </button>
        ))}
      </div>
      <input
        required
        placeholder="Ej: Primer mensaje"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
        style={{ borderColor: "var(--color-line)" }}
      />
      <input
        type="date"
        required
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
        style={{ borderColor: "var(--color-line)" }}
      />
      <textarea
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent resize-none"
        style={{ borderColor: "var(--color-line)" }}
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-full border px-4 py-3 text-sm" style={{ borderColor: "var(--color-line)" }}>
          Cancelar
        </button>
        <button disabled={submitting || !title.trim() || !eventDate} className="flex-1 rounded-full bg-accent px-4 py-3 text-sm text-surface disabled:opacity-50">
          {submitting ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
