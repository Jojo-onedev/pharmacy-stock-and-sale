import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { AppShell, btnGhost, btnPrimary, card, inputCls } from "@/components/AppShell";
import { actions, useStore, type Order } from "@/lib/store";

export const Route = createFileRoute("/commandes")({
  head: () => ({
    meta: [
      { title: "Commandes fournisseurs — Pharmacie Siloé" },
      { name: "description", content: "Préparation et bons de commande PDF de la Pharmacie Siloé." },
      { property: "og:title", content: "Commandes fournisseurs — Pharmacie Siloé" },
      { property: "og:description", content: "Préparation et bons de commande PDF de la Pharmacie Siloé." },
    ],
  }),
  component: () => <AppShell roles={["admin"]}><Commandes /></AppShell>,
});

async function downloadPdf(o: Order) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const green: [number, number, number] = [15, 118, 92];
  doc.setFillColor(...green); doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(24);
  doc.text("Pharmacie Siloé", 14, 20);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text("Bon de commande fournisseur", 14, 28);
  doc.setTextColor(30, 30, 30); doc.setFontSize(11);
  doc.text(`N° de commande : ${o.number}`, 14, 48);
  doc.text(`Date : ${new Date(o.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 55);
  doc.text(`Agent responsable : ${o.userName}`, 14, 62);
  autoTable(doc, {
    startY: 72,
    head: [["#", "Désignation", "Référence", "Quantité"]],
    body: o.items.map((i, k) => [k + 1, i.name, i.code, i.qty]),
    headStyles: { fillColor: green },
    columnStyles: { 0: { cellWidth: 12 }, 3: { halign: "right", cellWidth: 28 } },
    foot: [["", "Total articles", "", o.items.reduce((a, i) => a + i.qty, 0)]],
    footStyles: { fillColor: [235, 245, 240], textColor: 20, fontStyle: "bold", halign: "right" },
  });
  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 25;
  doc.text("Signature et cachet :", 130, y);
  doc.save(`${o.number}.pdf`);
}

function Commandes() {
  const s = useStore();
  const [lines, setLines] = useState<Record<string, number>>({});
  const [pick, setPick] = useState("");
  const suggest = () => {
    const n: Record<string, number> = { ...lines };
    s.products.filter((p) => p.qty <= p.threshold).forEach((p) => { n[p.id] = Math.max(n[p.id] ?? 0, p.threshold * 3 - p.qty); });
    setLines(n);
  };
  const items = Object.entries(lines).map(([id, qty]) => ({ p: s.products.find((x) => x.id === id), qty })).filter((x) => x.p && x.qty > 0);
  const create = async () => {
    const o = actions.recordOrder(items.map(({ p, qty }) => ({ name: p!.name, code: p!.code, qty })));
    setLines({});
    await downloadPdf(o);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className={card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl font-bold">Préparer une commande</h2><button className={btnGhost} onClick={suggest}>Ajouter les produits en stock faible</button></div>
        <div className="mb-4 flex gap-2">
          <select className={inputCls} value={pick} onChange={(e) => setPick(e.target.value)}><option value="">Choisir un produit…</option>{s.products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.qty})</option>)}</select>
          <button className={btnPrimary} disabled={!pick} onClick={() => { setLines({ ...lines, [pick]: (lines[pick] ?? 0) + 1 }); setPick(""); }}><Plus className="h-4 w-4" />Ajouter</button>
        </div>
        {items.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Aucun article dans la commande</p> : (
          <div className="divide-y rounded-xl border">{items.map(({ p, qty }) => (
            <div key={p!.id} className="flex items-center gap-3 p-3">
              <div className="flex-1"><div className="text-sm font-medium">{p!.name}</div><div className="text-xs text-muted-foreground">{p!.code} · stock actuel {p!.qty}</div></div>
              <input type="number" min={1} className="w-24 rounded-lg border bg-background px-2 py-1.5 text-right text-sm" value={qty} onChange={(e) => setLines({ ...lines, [p!.id]: Number(e.target.value) })} />
              <button className="text-muted-foreground hover:text-destructive" onClick={() => { const n = { ...lines }; delete n[p!.id]; setLines(n); }}><Trash2 className="h-4 w-4" /></button>
            </div>))}
          </div>
        )}
        <div className="mt-4 flex justify-end"><button className={btnPrimary} disabled={!items.length} onClick={create}><Download className="h-4 w-4" />Générer le bon de commande PDF</button></div>
      </section>
      <section className={card}>
        <h2 className="mb-4 font-display text-xl font-bold">Bons de commande</h2>
        {s.orders.length === 0 ? <p className="text-sm text-muted-foreground">Aucun bon pour l'instant.</p> : (
          <div className="divide-y">{s.orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between py-3">
              <div><div className="text-sm font-semibold">{o.number}</div><div className="text-xs text-muted-foreground">{new Date(o.date).toLocaleDateString("fr-FR")} · {o.userName} · {o.items.length} article(s)</div></div>
              <button className={btnGhost} onClick={() => downloadPdf(o)}><Download className="h-4 w-4" />PDF</button>
            </div>))}
          </div>
        )}
      </section>
    </div>
  );
}
