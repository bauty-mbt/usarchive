import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useCouple } from "../context/CoupleContext";
import type { Theme } from "../types";

type Step = "welcome" | "nickname" | "choice" | "invite" | "join" | "theme";

const themes: { id: Theme; label: string; blurb: string }[] = [
  { id: "minimal", label: "Minimal", blurb: "Papel claro, tinta cálida" },
  { id: "garden", label: "Garden", blurb: "Verdes suaves, orgánico" },
  { id: "midnight", label: "Midnight", blurb: "Oscuro, dorado apagado" },
  { id: "paper", label: "Paper", blurb: "Blanco puro, editorial" },
  { id: "digital", label: "Digital", blurb: "Gris frío, cian eléctrico" },
  { id: "sunset", label: "Sunset", blurb: "Naranjas y rosados terrosos" },
  { id: "cosmic", label: "Cosmic", blurb: "Violeta profundo, estelar" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refresh } = useCouple();
  const [step, setStep] = useState<Step>("welcome");
  const [myNickname, setMyNickname] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createCouple() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ invitationCode: string }>("/couples", {
        method: "POST",
        body: JSON.stringify({ myNickname, partnerName }),
      });
      setGeneratedCode(res.invitationCode);
      setStep("invite");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  async function joinCouple() {
    setBusy(true);
    setError(null);
    try {
      await api("/couples/join", {
        method: "POST",
        body: JSON.stringify({ code: code.trim().toUpperCase(), myNickname }),
      });
      setStep("theme");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  }

  async function pickTheme(theme: Theme) {
    setBusy(true);
    try {
      await api("/couples/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme: theme.toUpperCase() }),
      });
      document.documentElement.setAttribute("data-theme", theme);
      await refresh();
      navigate("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink flex items-center justify-center px-6" data-theme="minimal">
      <div className="w-full max-w-sm">
        {step === "welcome" && (
          <StepCard>
            <p className="font-serif text-2xl leading-snug">
              Todavía no conocés todo sobre esta persona.
              <br />
              <span className="text-inkMuted">Y eso está bueno.</span>
            </p>
            <p className="text-sm text-inkMuted mt-4">Empecemos por algo pequeño.</p>
            <PrimaryButton onClick={() => setStep("nickname")}>Empezar</PrimaryButton>
          </StepCard>
        )}

        {step === "nickname" && (
          <StepCard title="¿Cómo querés que te llamemos?">
            <input
              autoFocus
              value={myNickname}
              onChange={(e) => setMyNickname(e.target.value)}
              placeholder="Tu apodo"
              className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
              style={{ borderColor: "var(--color-line)" }}
            />
            <PrimaryButton disabled={!myNickname.trim()} onClick={() => setStep("choice")}>
              Continuar
            </PrimaryButton>
          </StepCard>
        )}

        {step === "choice" && (
          <StepCard title="¿Ya tenés un código de invitación?">
            <p className="text-sm text-inkMuted">
              Si tu pareja ya creó el espacio, pedile el código. Si sos el primero, generamos uno para compartirle.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <SecondaryButton onClick={() => setStep("join")}>Tengo un código</SecondaryButton>
              <PrimaryButton onClick={() => setStep("nickname-partner" as Step)}>
                Soy el primero — crear espacio
              </PrimaryButton>
            </div>
          </StepCard>
        )}

        {step === ("nickname-partner" as Step) && (
          <StepCard title="¿Cómo se llama tu pareja?">
            <input
              autoFocus
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Su nombre"
              className="w-full rounded-card border px-4 py-3 text-sm outline-none focus:border-accent"
              style={{ borderColor: "var(--color-line)" }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <PrimaryButton disabled={!partnerName.trim() || busy} onClick={createCouple}>
              {busy ? "Creando…" : "Generar invitación"}
            </PrimaryButton>
          </StepCard>
        )}

        {step === "invite" && generatedCode && (
          <StepCard title="Compartile este código">
            <div
              className="rounded-card border-2 border-dashed px-6 py-8 text-center font-serif text-3xl tracking-wider"
              style={{ borderColor: "var(--color-accent)" }}
            >
              {generatedCode}
            </div>
            <p className="text-sm text-inkMuted mt-3">
              Expira en 7 días. Cuando tu pareja lo use, el espacio se activa para los dos.
            </p>
            <PrimaryButton onClick={() => setStep("theme")}>Elegir estética mientras tanto</PrimaryButton>
          </StepCard>
        )}

        {step === "join" && (
          <StepCard title="Ingresá el código">
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="INV-XXXX-XX"
              className="w-full rounded-card border px-4 py-3 text-sm uppercase tracking-wider outline-none focus:border-accent"
              style={{ borderColor: "var(--color-line)" }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <PrimaryButton disabled={!code.trim() || busy} onClick={joinCouple}>
              {busy ? "Vinculando…" : "Vincular"}
            </PrimaryButton>
          </StepCard>
        )}

        {step === "theme" && (
          <StepCard title="Elegí un universo visual">
            <p className="text-sm text-inkMuted -mt-2">Podés cambiarlo después.</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  disabled={busy}
                  onClick={() => pickTheme(t.id)}
                  data-theme={t.id}
                  className="rounded-card border px-3 py-4 text-left transition-transform active:scale-[0.98]"
                  style={{ borderColor: "var(--color-line)", background: "var(--color-surface-alt)" }}
                >
                  <p className="font-serif text-base" style={{ color: "var(--color-ink)" }}>{t.label}</p>
                  <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{t.blurb}</p>
                </button>
              ))}
            </div>
          </StepCard>
        )}
      </div>
    </div>
  );
}

function StepCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {title && <h2 className="font-serif text-2xl">{title}</h2>}
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-accent px-4 py-3 text-sm text-surface disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-full border px-4 py-3 text-sm"
      style={{ borderColor: "var(--color-line)" }}
    >
      {children}
    </button>
  );
}
