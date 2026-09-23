import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Shell from "../components/Shell";

interface SessionInfo {
  id: string;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: string;
  expiresAt: string;
}

export default function PrivacyCenter() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  async function load() {
    const res = await api<{ sessions: SessionInfo[] }>("/auth/sessions");
    setSessions(res.sessions);
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(id: string) {
    await api(`/auth/sessions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Shell title="🔐 Privacy Center">
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-inkMuted mb-2">Cuenta</p>
          <p className="text-sm">{user?.displayName} · {user?.email}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-inkMuted mb-2">Cómo funciona la privacidad acá</p>
          <ul className="text-sm space-y-1.5 text-inkMuted">
            <li>• Lo que vos escribís sobre tu pareja solo lo podés editar vos.</li>
            <li>• Tu pareja no puede leer tu espacio salvo que vos actives esa opción.</li>
            <li>• La timeline es compartida; el resto es privado por defecto.</li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-inkMuted mb-2">Sesiones activas</p>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-card border px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--color-line)" }}>
                <div>
                  <p className="text-sm">{s.userAgent?.slice(0, 40) ?? "Dispositivo"}</p>
                  <p className="text-xs text-inkMuted">
                    desde {new Date(s.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <button onClick={() => revoke(s.id)} className="text-xs text-accent underline underline-offset-2">
                  cerrar
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full rounded-full border px-4 py-3 text-sm"
          style={{ borderColor: "var(--color-line)" }}
        >
          Cerrar sesión
        </button>
      </div>
    </Shell>
  );
}
