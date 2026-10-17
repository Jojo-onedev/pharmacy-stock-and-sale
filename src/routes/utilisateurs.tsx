import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { AppShell, btnGhost, btnPrimary, card, inputCls } from "@/components/AppShell";
import { actions, useStore, type Role } from "@/lib/store";

export const Route = createFileRoute("/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — Pharmacie Siloé" },
      { name: "description", content: "Gestion des comptes et codes PIN de la Pharmacie Siloé." },
      { property: "og:title", content: "Utilisateurs — Pharmacie Siloé" },
      { property: "og:description", content: "Gestion des comptes et codes PIN de la Pharmacie Siloé." },
    ],
  }),
  component: () => <AppShell roles={["admin"]}><Users /></AppShell>,
});

type Draft = { id?: string; name: string; role: Role; active: boolean; pin: string };

function Users() {
  const s = useStore();
  const [d, setD] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const save = () => {
    if (!d!.name.trim()) return setErr("Nom requis");
    if ((!d!.id || d!.pin) && !/^\d{4,6}$/.test(d!.pin)) return setErr("Le PIN doit contenir 4 à 6 chiffres");
    if (d!.id && d!.role !== "admin" && !s.users.some((u) => u.id !== d!.id && u.role === "admin" && u.active)) return setErr("Il doit rester au moins un administrateur actif");
    actions.saveUser({ id: d!.id, name: d!.name.trim(), role: d!.role, active: d!.active }, d!.pin || undefined);
    setD(null);
  };
  return (
    <section className={card}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Utilisateurs</h2><button className={btnPrimary} onClick={() => { setErr(""); setD({ name: "", role: "vendeur", active: true, pin: "" }); }}><Plus className="h-4 w-4" />Nouvel utilisateur</button></div>
      <div className="divide-y">{s.users.map((u) => (
        <div key={u.id} className="flex items-center justify-between py-3">
          <div><div className="font-medium">{u.name} {!u.active && <span className="text-xs text-destructive">(désactivé)</span>}</div><div className="text-xs text-muted-foreground">{u.role === "admin" ? "Administrateur" : "Vendeur"}</div></div>
          <button className={btnGhost} onClick={() => { setErr(""); setD({ id: u.id, name: u.name, role: u.role, active: u.active, pin: "" }); }}><Pencil className="h-4 w-4" />Modifier</button>
        </div>))}
      </div>
      {d && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6">
            <h3 className="font-display text-lg font-bold">{d.id ? "Modifier" : "Créer"} un compte</h3>
            <label className="block text-sm">Nom<input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></label>
            <label className="block text-sm">Rôle<select className={inputCls} value={d.role} onChange={(e) => setD({ ...d, role: e.target.value as Role })}><option value="vendeur">Vendeur</option><option value="admin">Administrateur</option></select></label>
            <label className="block text-sm">{d.id ? "Nouveau PIN (laisser vide pour conserver)" : "Code PIN"}<input type="password" inputMode="numeric" maxLength={6} className={inputCls} value={d.pin} onChange={(e) => setD({ ...d, pin: e.target.value.replace(/\D/g, "") })} /></label>
            {d.id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} />Compte actif</label>}
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex justify-end gap-2"><button className={btnGhost} onClick={() => setD(null)}>Annuler</button><button className={btnPrimary} onClick={save}>Enregistrer</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
