import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Search, Send, Trash2, Printer, CheckCircle2, Banknote, Smartphone, Shuffle } from "lucide-react";
import { AppShell, btnGhost, btnPrimary, card, inputCls } from "@/components/AppShell";
import { actions, fcfa, useStore, type PayMode, type Sale, type SaleItem } from "@/lib/store";
import { computePayment } from "@/lib/payment";

export const Route = createFileRoute("/vente")({
  head: () => ({
    meta: [
      { title: "Vente & Caisse — Pharmacie Siloé" },
      { name: "description", content: "Point de vente et caisse de la Pharmacie Siloé." },
      { property: "og:title", content: "Vente & Caisse — Pharmacie Siloé" },
      { property: "og:description", content: "Point de vente et caisse de la Pharmacie Siloé." },
    ],
  }),
  component: () => <AppShell><Vente /></AppShell>,
});

function Vente() {
  const s = useStore();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [checkout, setCheckout] = useState<SaleItem[] | null>(null);
  const [mode, setMode] = useState<PayMode>("cash");
  const [received, setReceived] = useState("");
  const [momo, setMomo] = useState("");
  const [ticket, setTicket] = useState<Sale | null>(null);

  const list = useMemo(() => {
    const t = q.toLowerCase().trim();
    return s.products.filter((p) => !t || p.name.toLowerCase().includes(t) || p.code.includes(t));
  }, [q, s.products]);
  const stockOf = (id: string) => s.products.find((p) => p.id === id)?.qty ?? 0;
  const add = (id: string) => {
    const p = s.products.find((x) => x.id === id)!;
    setCart((c) => {
      const ex = c.find((i) => i.productId === id);
      if (ex) return ex.qty >= p.qty ? c : c.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i));
      return p.qty > 0 ? [...c, { productId: p.id, name: p.name, price: p.price, qty: 1 }] : c;
    });
  };
  const setQty = (id: string, qty: number) => setCart((c) => c.flatMap((i) => (i.productId !== id ? [i] : qty <= 0 ? [] : [{ ...i, qty: Math.min(qty, stockOf(id)) }])));
  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const dueTotal = checkout?.reduce((a, i) => a + i.price * i.qty, 0) ?? 0;
  const pay = computePayment(dueTotal, mode, Number(received) || 0, Number(momo) || 0);

  const validate = () => {
    if (!checkout || !pay.valid) return;
    const sale = actions.recordSale({ items: checkout, total: dueTotal, cash: pay.cash, momo: pay.momo, received: mode === "momo" ? 0 : Number(received) || 0, change: pay.change, mode });
    setTicket(sale); setCheckout(null); setReceived(""); setMomo(""); setMode("cash");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className={`${card} no-print`}>
        <h2 className="font-display text-xl font-bold">Vente</h2>
        <div className="relative my-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input autoFocus className={`${inputCls} pl-9`} placeholder="Rechercher un médicament ou scanner un code-barres…" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { const m = s.products.find((p) => p.code === q.trim()) ?? list[0]; if (m) { add(m.id); setQ(""); } } }} />
        </div>
        <div className="grid max-h-[340px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {list.map((p) => (
            <button key={p.id} disabled={p.qty === 0} onClick={() => add(p.id)} className="flex items-center justify-between rounded-xl border p-3 text-left hover:border-primary hover:bg-accent/40 disabled:opacity-50">
              <div><div className="text-sm font-semibold">{p.name}</div><div className="text-xs text-muted-foreground">{p.code} · {p.qty === 0 ? "Rupture" : `${p.qty} en stock`}</div></div>
              <div className="text-sm font-bold text-primary">{fcfa(p.price)}</div>
            </button>
          ))}
        </div>
        <h3 className="mt-6 mb-2 font-semibold">Panier</h3>
        {cart.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Panier vide</p> : (
          <div className="divide-y rounded-xl border">
            {cart.map((i) => (
              <div key={i.productId} className="flex items-center gap-3 p-3">
                <div className="flex-1"><div className="text-sm font-medium">{i.name}</div><div className="text-xs text-muted-foreground">{fcfa(i.price)}</div></div>
                <button className={btnGhost} onClick={() => setQty(i.productId, i.qty - 1)}><Minus className="h-3 w-3" /></button>
                <input className="w-14 rounded-lg border bg-background py-1.5 text-center text-sm" value={i.qty} onChange={(e) => setQty(i.productId, Number(e.target.value) || 0)} />
                <button className={btnGhost} onClick={() => setQty(i.productId, i.qty + 1)}><Plus className="h-3 w-3" /></button>
                <div className="w-28 text-right text-sm font-semibold">{fcfa(i.price * i.qty)}</div>
                <button onClick={() => setQty(i.productId, 0)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">Total</div><div className="font-display text-2xl font-bold">{fcfa(total)}</div></div>
          <button className={btnPrimary} disabled={!cart.length || !!checkout} onClick={() => { setCheckout(cart); setCart([]); }}><Send className="h-4 w-4" />Envoyer à la caisse</button>
        </div>
      </section>

      <section className={`${card} no-print bg-secondary`}>
        <h2 className="font-display text-xl font-bold">Caisse</h2>
        {!checkout ? <p className="mt-10 text-center text-sm text-muted-foreground">En attente d'une vente…</p> : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <div className="text-sm opacity-80">Montant à régler · {checkout.length} article(s)</div>
              <div className="font-display text-4xl font-bold">{fcfa(dueTotal)}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([["cash", "Espèces", Banknote], ["momo", "Mobile Money", Smartphone], ["mixte", "Mixte", Shuffle]] as const).map(([m, l, I]) => (
                <button key={m} onClick={() => setMode(m)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium ${mode === m ? "border-primary bg-card ring-2 ring-primary" : "bg-card"}`}><I className="h-5 w-5" />{l}</button>
              ))}
            </div>
            {mode === "mixte" && (
              <div><label className="text-sm font-medium">Part Mobile Money</label><input type="number" className={inputCls} value={momo} onChange={(e) => setMomo(e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Reste en espèces : {fcfa(Math.max(0, dueTotal - (Number(momo) || 0)))}</p></div>
            )}
            {mode !== "momo" && (
              <div><label className="text-sm font-medium">Espèces reçues</label><input type="number" className={`${inputCls} text-lg`} value={received} onChange={(e) => setReceived(e.target.value)} />
                <div className="mt-2 flex flex-wrap gap-2">{[1000, 2000, 5000, 10000].map((v) => <button key={v} className={btnGhost} onClick={() => setReceived(String((Number(received) || 0) + v))}>+{v}</button>)}</div></div>
            )}
            {mode === "momo" && <p className="rounded-xl bg-card p-3 text-sm">Encaisser {fcfa(dueTotal)} via Mobile Money.</p>}
            <div className="flex items-center justify-between rounded-xl bg-card p-4">
              <span className="text-sm font-medium">Monnaie à rendre</span>
              <span className={`font-display text-2xl font-bold ${pay.valid ? "text-primary" : "text-muted-foreground"}`}>{fcfa(pay.change)}</span>
            </div>
            <div className="flex gap-2">
              <button className={btnGhost} onClick={() => { setCart(checkout); setCheckout(null); }}>Retour</button>
              <button className={`${btnPrimary} flex-1 py-3`} disabled={!pay.valid} onClick={validate}><CheckCircle2 className="h-4 w-4" />Valider la vente</button>
            </div>
          </div>
        )}
      </section>

      {ticket && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5">
            <div className="print-area font-mono text-xs">
              <div className="text-center"><div className="text-base font-bold">PHARMACIE SILOÉ</div><div>Ticket {ticket.number}</div><div>{new Date(ticket.date).toLocaleString("fr-FR")}</div><div>Agent : {ticket.userName}</div></div>
              <hr className="my-2 border-dashed" />
              {ticket.items.map((i) => <div key={i.productId} className="flex justify-between gap-2"><span>{i.qty} x {i.name}</span><span>{fcfa(i.qty * i.price)}</span></div>)}
              <hr className="my-2 border-dashed" />
              <div className="flex justify-between font-bold"><span>TOTAL</span><span>{fcfa(ticket.total)}</span></div>
              {ticket.momo > 0 && <div className="flex justify-between"><span>Mobile Money</span><span>{fcfa(ticket.momo)}</span></div>}
              {ticket.mode !== "momo" && <div className="flex justify-between"><span>Espèces reçues</span><span>{fcfa(ticket.received)}</span></div>}
              <div className="flex justify-between"><span>Monnaie rendue</span><span>{fcfa(ticket.change)}</span></div>
              <p className="mt-3 text-center">Merci de votre confiance !</p>
            </div>
            <div className="no-print mt-4 flex gap-2">
              <button className={`${btnGhost} flex-1`} onClick={() => setTicket(null)}>Fermer</button>
              <button className={`${btnPrimary} flex-1`} onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
