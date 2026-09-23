import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, displayName);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6" data-theme="minimal">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl mb-2">Empecemos</h1>
        <p className="text-inkMuted text-sm mb-8">Vas a construir el mapa de la persona que amás.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required
            placeholder="¿Cómo querés que te llamemos?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
            style={{ borderColor: "var(--color-line)" }}
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
            style={{ borderColor: "var(--color-line)" }}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Contraseña (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
            style={{ borderColor: "var(--color-line)" }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={submitting}
            className="w-full rounded-full bg-accent px-4 py-3 text-sm text-surface disabled:opacity-60"
          >
            {submitting ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-inkMuted">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-accent underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
