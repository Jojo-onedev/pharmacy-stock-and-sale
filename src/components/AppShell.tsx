import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ShoppingCart, Package, FileText, History, Users, LogOut, Cross, LayoutDashboard, Lock } from "lucide-react";
import { actions, canManageProducts, currentUser, fcfa, openSalesOf, useHydrated, useStore, type Role, type User } from "@/lib/store";
import { summarizeSales } from "@/lib/closure";

const nav = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin"] },
  { to: "/vente", label: "Vente & Caisse", icon: ShoppingCart, roles: ["admin", "vendeur"] },
  { to: "/historique", label: "Historique", icon: History, roles: ["admin", "vendeur"] },
  { to: "/stock", label: "Stock", icon: Package, roles: ["admin"], stock: true },
  { to: "/commandes", label: "Commandes", icon: FileText, roles: ["admin"] },
  { to: "/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["admin"] },
] as const;

export function AppShell({ children, roles = ["admin", "vendeur"], allow }: { children: ReactNode; roles?: Role[]; allow?: (u: User) => boolean }) {
  const [closing, setClosing] = useState(false);
  const hydrated = useHydrated();
  const s = useStore();
  const user = currentUser(s);
  const navigate = useNavigate();
  const allowed = user && (allow ? allow(user) : roles.includes(user.role));
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
            {nav.filter((n) => ("stock" in n && canManageProducts(user)) || (n.roles as readonly string[]).includes(user.role)).map((n) => (
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
            <button onClick={() => setClosing(true)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"><Lock className="h-4 w-4" />Arrêter mon compte</button>
            <button onClick={() => { actions.logout(); navigate({ to: "/", replace: true }); }} className="rounded-lg border p-2 hover:bg-muted" aria-label="Se déconnecter"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] p-5">{children}</main>
      {closing && <CloseAccount userId={user.id} onClose={() => setClosing(false)} />}
    </div>
  );
}

export const inputCls = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-40";
export const card = "rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]";

function CloseAccount({ userId, onClose }: { userId: string; onClose: () => void }) {
  const s = useStore();
  const open = openSalesOf(s, userId);
  const [counted, setCounted] = useState("");
  const sum = summarizeSales(open, counted === "" ? undefined : Number(counted));
  const first = open.length ? open[open.length - 1].date : null;
  const row = (l: string, v: string, strong = false) => <div className={`flex justify-between py-1.5 ${strong ? "font-bold" : ""}`}><span>{l}</span><span>{v}</span></div>;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6">
        <h3 className="font-display text-lg font-bold">Arrêt de compte individuel</h3>
        {open.length === 0 ? <p className="text-sm text-muted-foreground">Aucune vente depuis votre dernier arrêt de compte.</p> : (<>
          <p className="text-xs text-muted-foreground">{open.length} vente(s) depuis {new Date(first!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
          <div className="divide-y rounded-xl border px-4 text-sm">
            {row("Montant total vendu", fcfa(sum.total), true)}
            {row("Dont espèces", fcfa(sum.cash))}
            {row("Dont Mobile Money", fcfa(sum.momo))}
            {row("Doit se trouver en caisse (espèces)", fcfa(sum.expectedCash), true)}
          </div>
          <label className="block text-sm font-medium">Espèces comptées en caisse<input type="number" className={inputCls} value={counted} onChange={(e) => setCounted(e.target.value)} /></label>
          {counted !== "" && <p className={`rounded-xl p-3 text-sm font-semibold ${sum.diff > 0 ? "bg-warning/20" : sum.diff < 0 ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
            {sum.diff > 0 ? `Surplus : ${fcfa(sum.diff)}` : sum.diff < 0 ? `Manquant : ${fcfa(-sum.diff)}` : "Caisse juste"}</p>}
        </>)}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>Annuler</button>
          {open.length > 0 && <button className={btnPrimary} disabled={counted === ""} onClick={() => { actions.closeMyAccount(Number(counted)); onClose(); }}>Arrêter le compte</button>}
        </div>
      </div>
    </div>
  );
}
