import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Minus, Pencil, Trash2, Search } from "lucide-react";
import { AppShell, btnGhost, btnPrimary, card, inputCls } from "@/components/AppShell";
import { actions, fcfa, useStore, type Product } from "@/lib/store";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock — Pharmacie Siloé" },
      { name: "description", content: "Inventaire des médicaments et produits de la Pharmacie Siloé." },
      { property: "og:title", content: "Stock — Pharmacie Siloé" },
      { property: "og:description", content: "Inventaire des médicaments et produits de la Pharmacie Siloé." },
    ],
  }),
  component: () => <AppShell roles={["admin"]}><Stock /></AppShell>,
});

type Draft = Omit<Product, "id"> & { id?: string };
const empty: Draft = { name: "", code: "", qty: 0, price: 0, threshold: 10 };

export function stockStatus(p: Product) { return p.qty === 0 ? "rupture" : p.qty <= p.threshold ? "faible" : "ok"; }

function Stock() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [filter, setFilter] = useState<"all" | "faible" | "rupture">("all");
  const list = s.products.filter((p) => (p.name.toLowerCase().includes(q.toLowerCase()) || p.code.includes(q)) && (filter === "all" || stockStatus(p) === filter));
  const low = s.products.filter((p) => stockStatus(p) === "faible").length;
  const out = s.products.filter((p) => stockStatus(p) === "rupture").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}><div className="text-sm text-muted-foreground">Références</div><div className="font-display text-3xl font-bold">{s.products.length}</div></div>
        <button onClick={() => setFilter("faible")} className={`${card} text-left`}><div className="text-sm text-muted-foreground">Stock faible</div><div className="font-display text-3xl font-bold text-warning">{low}</div></button>
        <button onClick={() => setFilter("rupture")} className={`${card} text-left`}><div className="text-sm text-muted-foreground">En rupture</div><div className="font-display text-3xl font-bold text-destructive">{out}</div></button>
      </div>
      <div className={card}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input className={`${inputCls} pl-9`} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className={`${inputCls} w-auto`} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">Tous</option><option value="faible">Stock faible</option><option value="rupture">Rupture</option></select>
          <button className={btnPrimary} onClick={() => setEdit(empty)}><Plus className="h-4 w-4" />Nouveau produit</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Produit</th><th>Code-barres</th><th className="text-right">Prix public</th><th className="text-center">Quantité</th><th>État</th><th /></tr></thead>
            <tbody>
              {list.map((p) => { const st = stockStatus(p); return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{p.name}</td><td className="text-muted-foreground">{p.code}</td><td className="text-right">{fcfa(p.price)}</td>
                  <td><div className="flex items-center justify-center gap-2">
                    <button className={btnGhost} onClick={() => actions.adjustQty(p.id, -1)}><Minus className="h-3 w-3" /></button>
                    <span className="w-10 text-center font-semibold">{p.qty}</span>
                    <button className={btnGhost} onClick={() => actions.adjustQty(p.id, 1)}><Plus className="h-3 w-3" /></button>
                    <button className={btnGhost} onClick={() => actions.adjustQty(p.id, 10)}>+10</button>
                  </div></td>
                  <td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st === "rupture" ? "bg-destructive/15 text-destructive" : st === "faible" ? "bg-warning/20 text-warning" : "bg-primary/10 text-primary"}`}>{st === "rupture" ? "Rupture" : st === "faible" ? "Faible" : "OK"}</span></td>
                  <td className="text-right"><button className="p-2 text-muted-foreground hover:text-foreground" onClick={() => setEdit(p)}><Pencil className="h-4 w-4" /></button>
                    <button className="p-2 text-muted-foreground hover:text-destructive" onClick={() => confirm(`Supprimer ${p.name} ?`) && actions.deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></button></td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </div>
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <form className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6" onSubmit={(e) => { e.preventDefault(); if (edit.name.trim()) { actions.saveProduct(edit); setEdit(null); } }}>
            <h3 className="font-display text-lg font-bold">{edit.id ? "Modifier" : "Nouveau"} produit</h3>
            <label className="block text-sm">Nom<input className={inputCls} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label className="block text-sm">Référence / code-barres<input className={inputCls} value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} /></label>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-sm">Quantité<input type="number" className={inputCls} value={edit.qty} onChange={(e) => setEdit({ ...edit, qty: Number(e.target.value) })} /></label>
              <label className="block text-sm">Prix (FCFA)<input type="number" className={inputCls} value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></label>
              <label className="block text-sm">Seuil alerte<input type="number" className={inputCls} value={edit.threshold} onChange={(e) => setEdit({ ...edit, threshold: Number(e.target.value) })} /></label>
            </div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" className={btnGhost} onClick={() => setEdit(null)}>Annuler</button><button className={btnPrimary}>Enregistrer</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
