import { createFileRoute } from "@tanstack/react-router";
import { AppShell, card } from "@/components/AppShell";
import { currentUser, fcfa, useStore } from "@/lib/store";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique & statistiques — Pharmacie Siloé" },
      { name: "description", content: "Historique des ventes et statistiques de la Pharmacie Siloé." },
      { property: "og:title", content: "Historique & statistiques — Pharmacie Siloé" },
      { property: "og:description", content: "Historique des ventes et statistiques de la Pharmacie Siloé." },
    ],
  }),
  component: () => <AppShell><Historique /></AppShell>,
});

const modeLabel = { cash: "Espèces", momo: "Mobile Money", mixte: "Mixte" };

function Historique() {
  const s = useStore();
  const me = currentUser(s)!;
  const isAdmin = me.role === "admin";
  const sales = isAdmin ? s.sales : s.sales.filter((x) => x.userId === me.id);
  const today = new Date().toDateString();
  const todays = sales.filter((x) => new Date(x.date).toDateString() === today);
  const sum = (arr: typeof sales, k: "total" | "cash" | "momo") => arr.reduce((a, x) => a + x[k], 0);
  const top = Object.entries(sales.flatMap((x) => x.items).reduce<Record<string, number>>((a, i) => ({ ...a, [i.name]: (a[i.name] ?? 0) + i.qty }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Ventes du jour" value={String(todays.length)} />
        <Stat label="Chiffre du jour" value={fcfa(sum(todays, "total"))} />
        <Stat label="Espèces (jour)" value={fcfa(sum(todays, "cash"))} />
        <Stat label="Mobile Money (jour)" value={fcfa(sum(todays, "momo"))} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className={card}>
          <h2 className="mb-4 font-display text-xl font-bold">{isAdmin ? "Toutes les ventes" : "Mes ventes"}</h2>
          {sales.length === 0 ? <p className="text-sm text-muted-foreground">Aucune vente enregistrée.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">N°</th><th>Date</th>{isAdmin && <th>Agent</th>}<th>Articles</th><th>Règlement</th><th className="text-right">Total</th></tr></thead>
              <tbody>{sales.map((x) => (
                <tr key={x.id} className="border-b last:border-0"><td className="py-2.5 font-medium">{x.number}</td><td>{new Date(x.date).toLocaleString("fr-FR")}</td>{isAdmin && <td>{x.userName}</td>}<td>{x.items.reduce((a, i) => a + i.qty, 0)}</td><td>{modeLabel[x.mode]}</td><td className="text-right font-semibold">{fcfa(x.total)}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </section>
        <div className="space-y-5">
          <section className={card}>
            <h3 className="mb-3 font-semibold">Produits les plus vendus</h3>
            {top.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : top.map(([n, q]) => <div key={n} className="flex justify-between py-1 text-sm"><span>{n}</span><span className="font-semibold">{q}</span></div>)}
            <div className="mt-3 border-t pt-3 text-sm">Total cumulé : <b>{fcfa(sum(sales, "total"))}</b></div>
          </section>
          {isAdmin && (
            <section className={card}>
              <h3 className="mb-3 font-semibold">Journal des actions</h3>
              <div className="max-h-80 space-y-2 overflow-y-auto text-xs">{s.logs.slice(0, 60).map((l) => <div key={l.id}><span className="text-muted-foreground">{new Date(l.date).toLocaleString("fr-FR")} · {l.userName}</span><div>{l.action}</div></div>)}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className={card}><div className="text-sm text-muted-foreground">{label}</div><div className="font-display text-2xl font-bold">{value}</div></div>;
}
