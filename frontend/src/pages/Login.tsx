import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6" data-theme="minimal">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl mb-2">UsArchive</h1>
        <p className="text-inkMuted text-sm mb-8">Tu pequeño archivo secreto de a dos.</p>

        <form onSubmit={onSubmit} className="space-y-3">
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
            placeholder="Contraseña"
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
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-inkMuted">
          ¿Primera vez acá?{" "}
          <Link to="/register" className="text-accent underline underline-offset-2">
            Creá tu cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
