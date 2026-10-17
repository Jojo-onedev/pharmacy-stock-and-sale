import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cross, Delete, Lock } from "lucide-react";
import { actions, currentUser, useHydrated, useStore } from "@/lib/store";
import { btnPrimary, inputCls } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — Pharmacie Siloé" },
      { name: "description", content: "Gestion de stock et de caisse de la Pharmacie Siloé." },
      { property: "og:title", content: "Connexion — Pharmacie Siloé" },
      { property: "og:description", content: "Gestion de stock et de caisse de la Pharmacie Siloé." },
    ],
  }),
  component: Login,
});

function Login() {
  const hydrated = useHydrated();
  const s = useStore();
  const navigate = useNavigate();
  const users = s.users.filter((u) => u.active);
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (hydrated && currentUser(s)) navigate({ to: "/vente", replace: true }); }, [hydrated, s, navigate]);
  useEffect(() => { if (!userId && users[0]) setUserId(users[0].id); }, [users, userId]);

  const submit = (p = pin) => {
    if (actions.login(userId, p)) navigate({ to: "/vente" });
    else { setError("Code PIN incorrect"); setPin(""); }
  };
  const press = (d: string) => {
    setError("");
    setPin((p) => {
      const n = (p + d).slice(0, 6);
      return n;
    });
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  if (!hydrated) return null;
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3"><Cross className="h-8 w-8" /><span className="font-display text-2xl font-bold">Pharmacie Siloé</span></div>
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight">Stock, vente et caisse,<br />au même comptoir.</h1>
          <p className="mt-4 max-w-md opacity-80">Chaque vente, chaque mouvement de stock et chaque bon de commande est enregistré au nom de l'agent connecté.</p>
        </div>
        <p className="text-sm opacity-60">© {new Date().getFullYear()} Pharmacie Siloé</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden"><Cross className="h-6 w-6 text-primary" /><span className="font-display text-xl font-bold">Pharmacie Siloé</span></div>
          <h2 className="font-display text-2xl font-bold">Ouvrir une session</h2>
          <p className="mb-6 text-sm text-muted-foreground">Choisissez votre profil puis saisissez votre code PIN.</p>
          <label className="mb-1 block text-sm font-medium">Profil</label>
          <select className={inputCls} value={userId} onChange={(e) => { setUserId(e.target.value); setPin(""); }}>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role === "admin" ? "Administrateur" : "Vendeur"}</option>)}
          </select>
          <div className="my-6 flex items-center justify-center gap-3">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full border-2 border-primary ${i < pin.length ? "bg-primary" : ""}`} />
            ))}
          </div>
          {error && <p className="mb-3 text-center text-sm font-medium text-destructive">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} onClick={() => press(d)} className="h-16 rounded-xl border bg-card text-xl font-semibold hover:bg-muted active:scale-95">{d}</button>
            ))}
            <button onClick={() => setPin((p) => p.slice(0, -1))} className="grid h-16 place-items-center rounded-xl border bg-card hover:bg-muted" aria-label="Effacer"><Delete className="h-5 w-5" /></button>
            <button onClick={() => press("0")} className="h-16 rounded-xl border bg-card text-xl font-semibold hover:bg-muted active:scale-95">0</button>
            <button onClick={() => submit()} disabled={pin.length < 4} className={`${btnPrimary} h-16 rounded-xl`}>OK</button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Comptes de démonstration : Administrateur 1234 · Vendeur 0000</p>
        </div>
      </div>
    </div>
  );
}
