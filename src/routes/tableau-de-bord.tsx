import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon } from "lucide-react";
import { AppShell, btnGhost, btnPrimary, card, inputCls } from "@/components/AppShell";
import { actions, fcfa, openSalesOf, todaySales, useStore } from "@/lib/store";
import { summarizeSales } from "@/lib/closure";

export const Route = createFileRoute("/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Pharmacie Siloé" },
      { name: "description", content: "Chiffre du jour, arrêts de compte et clôtures de la Pharmacie Siloé." },
      { property: "og:title", content: "Tableau de bord — Pharmacie Siloé" },
      { property: "og:description", content: "Chiffre du jour, arrêts de compte et clôtures de la Pharmacie Siloé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AppShell roles={["admin"]}><Dashboard /></AppShell>,
});

const t = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const diffTxt = (d: number) => (d > 0 ? `Surplus ${fcfa(d)}` : d < 0 ? `Manquant ${fcfa(-d)}` : "Juste");

function Dashboard() {
  const s = useStore();
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState("");
  const day = summarizeSales(todaySales(s), counted === "" ? undefined : Number(counted));
  const low = s.products.filter((p) => p.qty <= p.threshold);
  const sellers = s.users.map((u) => ({ u, open: summarizeSales(openSalesOf(s, u.id)) })).filter((x) => x.open.count > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Journée en cours</h1><p className="text-sm text-muted-foreground">Ouverte le {t(s.dayOpenedAt)}</p></div>
        <button className={btnPrimary} onClick={() => setClosing(true)}><Moon className="h-4 w-4" />Arrêter les comptes définitivement</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Chiffre du jour", fcfa(day.total)], ["Espèces", fcfa(day.cash)], ["Mobile Money", fcfa(day.momo)], ["Ventes", String(day.count)]].map(([l, v]) => (
          <div key={l} className={card}><div className="text-sm text-muted-foreground">{l}</div><div className="font-display text-2xl font-bold">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-semibold">Comptes non arrêtés</h2>
          {sellers.length === 0 ? <p className="text-sm text-muted-foreground">Aucun.</p> : sellers.map(({ u, open }) => (
            <div key={u.id} className="flex justify-between border-b py-2 text-sm last:border-0"><span>{u.name} · {open.count} vente(s)</span><span className="font-semibold">{fcfa(open.total)}</span></div>
          ))}
        </section>
        <section className={card}>
          <h2 className="mb-3 font-semibold">Stock faible ou épuisé</h2>
          {low.length === 0 ? <p className="text-sm text-muted-foreground">Tout va bien.</p> : low.map((p) => (
            <div key={p.id} className="flex justify-between border-b py-2 text-sm last:border-0"><span>{p.name}</span><span className={p.qty === 0 ? "font-semibold text-destructive" : "font-semibold"}>{p.qty}</span></div>
          ))}
        </section>
      </div>
      <section className={card}>
        <h2 className="mb-3 font-semibold">Historique des arrêts de compte</h2>
        {s.closures.length === 0 ? <p className="text-sm text-muted-foreground">Aucun arrêt de compte.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Date</th><th>Agent</th><th>Ventes</th><th className="text-right">Total</th><th className="text-right">Espèces</th><th className="text-right">Mobile Money</th><th className="text-right">Compté</th><th className="text-right">Écart</th></tr></thead>
            <tbody>{s.closures.map((c) => (
              <tr key={c.id} className="border-b last:border-0"><td className="py-2">{t(c.date)}</td><td>{c.userName}</td><td>{c.count}</td><td className="text-right font-semibold">{fcfa(c.total)}</td><td className="text-right">{fcfa(c.cash)}</td><td className="text-right">{fcfa(c.momo)}</td><td className="text-right">{fcfa(c.counted)}</td><td className="text-right">{diffTxt(c.diff)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <section className={card}>
        <h2 className="mb-3 font-semibold">Chiffres d'affaires des journées passées</h2>
        {s.days.length === 0 ? <p className="text-sm text-muted-foreground">Aucune journée clôturée.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Journée</th><th>Clôturée par</th><th>Ventes</th><th className="text-right">Chiffre d'affaires</th><th className="text-right">Espèces</th><th className="text-right">Mobile Money</th><th className="text-right">Écart caisse</th></tr></thead>
            <tbody>{s.days.map((d) => (
              <tr key={d.id} className="border-b last:border-0"><td className="py-2">{t(d.openedAt)} → {t(d.closedAt)}</td><td>{d.closedBy}</td><td>{d.count}</td><td className="text-right font-semibold">{fcfa(d.total)}</td><td className="text-right">{fcfa(d.cash)}</td><td className="text-right">{fcfa(d.momo)}</td><td className="text-right">{diffTxt(d.diff)}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      {closing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6">
            <h3 className="font-display text-lg font-bold">Clôture définitive de la journée</h3>
            <p className="text-sm text-muted-foreground">Les comptes encore ouverts seront arrêtés, les tickets en attente annulés, et les compteurs repartiront à zéro pour la journée suivante.</p>
            <div className="rounded-xl border px-4 py-2 text-sm">
              <div className="flex justify-between py-1 font-bold"><span>Chiffre du jour</span><span>{fcfa(day.total)}</span></div>
              <div className="flex justify-between py-1"><span>Espèces</span><span>{fcfa(day.cash)}</span></div>
              <div className="flex justify-between py-1"><span>Mobile Money</span><span>{fcfa(day.momo)}</span></div>
            </div>
            <label className="block text-sm font-medium">Espèces totales comptées<input type="number" className={inputCls} value={counted} onChange={(e) => setCounted(e.target.value)} /></label>
            {counted !== "" && <p className="text-sm font-semibold">{diffTxt(day.diff)}</p>}
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setClosing(false)}>Annuler</button>
              <button className={btnPrimary} disabled={counted === ""} onClick={() => { actions.closeDay(Number(counted)); setClosing(false); setCounted(""); }}>Clôturer la journée</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
