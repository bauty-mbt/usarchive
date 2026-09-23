import Shell from "../components/Shell";

// Placeholder MVP: por defecto Profile.visibleToSubject = false, así que
// esta vista informa el estado en vez de listar nada. Cuando el owner active
// la visibilidad desde su Privacy Center, acá se consumiría
// GET /knowledge/profiles/:partnerProfileId/entries (mismo endpoint,
// autorizado por assertProfileAccess en modo "read" para el subject).
export default function PartnerView() {
  return (
    <Shell title="Lo que descubrieron sobre vos">
      <div className="rounded-card border border-dashed px-6 py-10 text-center" style={{ borderColor: "var(--color-line)" }}>
        <span className="text-2xl">🔒</span>
        <p className="text-sm text-inkMuted mt-3 max-w-xs mx-auto">
          Este espacio es privado por diseño. Tu pareja puede elegir compartírtelo cuando quiera desde su Privacy Center.
        </p>
      </div>
    </Shell>
  );
}
