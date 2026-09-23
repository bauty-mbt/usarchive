import { NavLink } from "react-router-dom";
import { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Mapa", icon: "✦" },
  { to: "/memories", label: "Recuerdos", icon: "📸" },
  { to: "/timeline", label: "Timeline", icon: "⏳" },
  { to: "/search", label: "Buscar", icon: "⌕" },
];

export default function Shell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-surface text-ink pb-24 md:pb-0">
      {title && (
        <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-4 md:px-10 md:pt-10">
          <h1 className="font-serif text-2xl md:text-3xl">{title}</h1>
        </header>
      )}

      <main className="px-5 md:px-10">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t bg-surface/95 backdrop-blur
                   md:left-0 md:top-0 md:h-screen md:w-20 md:flex-col md:justify-start md:gap-8 md:border-r md:border-t-0 md:pt-10"
        style={{ borderColor: "var(--color-line)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2.5 text-[11px] transition-colors ${
                isActive ? "text-accent" : "text-inkMuted"
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
