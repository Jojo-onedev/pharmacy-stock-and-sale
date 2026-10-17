import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ShoppingCart, Package, FileText, History, Users, LogOut, Cross } from "lucide-react";
import { actions, currentUser, useHydrated, useStore, type Role } from "@/lib/store";

const nav = [
  { to: "/vente", label: "Vente & Caisse", icon: ShoppingCart, roles: ["admin", "vendeur"] },
  { to: "/historique", label: "Historique", icon: History, roles: ["admin", "vendeur"] },
  { to: "/stock", label: "Stock", icon: Package, roles: ["admin"] },
  { to: "/commandes", label: "Commandes", icon: FileText, roles: ["admin"] },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["admin"] },
] as const;

export function AppShell({ children, roles = ["admin", "vendeur"] }: { children: ReactNode; roles?: Role[] }) {
  const hydrated = useHydrated();
  const s = useStore();
  const user = currentUser(s);
  const navigate = useNavigate();
  const allowed = user && roles.includes(user.role);
  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/", replace: true });
    else if (hydrated && user && !allowed) navigate({ to: "/vente", replace: true });
  }, [hydrated, user, allowed, navigate]);
  if (!hydrated || !user || !allowed) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Cross className="h-5 w-5" /></span>
            <span className="font-display text-lg font-bold">Pharmacie Siloé</span>
          </div>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {nav.filter((n) => (n.roles as readonly string[]).includes(user.role)).map((n) => (
              <Link key={n.to} to={n.to} className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" activeProps={{ className: "!bg-accent !text-accent-foreground" }}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.role === "admin" ? "Administrateur" : "Vendeur"}</div>
            </div>
            <button onClick={() => { actions.logout(); navigate({ to: "/", replace: true }); }} className="rounded-lg border p-2 hover:bg-muted" aria-label="Se déconnecter"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] p-5">{children}</main>
    </div>
  );
}

export const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40";
export const card = "rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]";
