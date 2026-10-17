import { useEffect, useState, useSyncExternalStore } from "react";

export type Role = "admin" | "vendeur";
export type User = { id: string; name: string; role: Role; pinHash: string; active: boolean };
export type Product = { id: string; name: string; code: string; qty: number; price: number; threshold: number };
export type SaleItem = { productId: string; name: string; price: number; qty: number };
export type PayMode = "cash" | "momo" | "mixte";
export type Sale = {
  id: string; number: string; date: string; userId: string; userName: string;
  items: SaleItem[]; total: number; cash: number; momo: number; received: number; change: number; mode: PayMode;
};
export type Order = { id: string; number: string; date: string; userName: string; items: { name: string; code: string; qty: number }[] };
export type Log = { id: string; date: string; userName: string; action: string };

type State = { users: User[]; products: Product[]; sales: Sale[]; orders: Order[]; logs: Log[]; sessionUserId: string | null };

export function hashPin(pin: string) {
  let h = 2166136261;
  for (const c of "siloe:" + pin) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const seed: State = {
  users: [
    { id: "u-admin", name: "Administrateur", role: "admin", pinHash: hashPin("1234"), active: true },
    { id: "u-vend", name: "Vendeur 1", role: "vendeur", pinHash: hashPin("0000"), active: true },
  ],
  products: [
    ["Paracétamol 500mg (boîte 20)", "6001001", 120, 750, 20],
    ["Amoxicilline 500mg", "6001002", 45, 2500, 15],
    ["Ibuprofène 400mg", "6001003", 8, 1200, 10],
    ["Vitamine C 1000mg", "6001004", 60, 1800, 10],
    ["Sirop contre la toux 125ml", "6001005", 0, 2200, 5],
    ["Artéméther/Luméfantrine", "6001006", 30, 3500, 10],
    ["Sérum physiologique 5ml x10", "6001007", 75, 1000, 15],
    ["Compresses stériles", "6001008", 4, 600, 10],
    ["Métronidazole 250mg", "6001009", 50, 1500, 10],
    ["Gel hydroalcoolique 100ml", "6001010", 90, 900, 20],
  ].map(([name, code, qty, price, threshold]) => ({ id: uid(), name, code, qty, price, threshold }) as Product),
  sales: [], orders: [], logs: [], sessionUserId: null,
};

const KEY = "pharmacie-siloe-v1";
let state: State = seed;
let loaded = false;
const listeners = new Set<() => void>();
function ensure() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...seed, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
function set(fn: (s: State) => State) {
  ensure();
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
export function useStore() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => { ensure(); return state; },
    () => seed,
  );
}
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
export function currentUser(s: State) { return s.users.find((u) => u.id === s.sessionUserId) ?? null; }
export const fcfa = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

function log(s: State, action: string): Log[] {
  const u = currentUser(s);
  return [{ id: uid(), date: new Date().toISOString(), userName: u?.name ?? "?", action }, ...s.logs].slice(0, 500);
}

export const actions = {
  login(userId: string, pin: string) {
    ensure();
    const u = state.users.find((x) => x.id === userId && x.active);
    if (!u || u.pinHash !== hashPin(pin)) return false;
    set((s) => { const n = { ...s, sessionUserId: u.id }; return { ...n, logs: log(n, "Connexion") }; });
    return true;
  },
  logout() { set((s) => ({ ...s, logs: log(s, "Déconnexion"), sessionUserId: null })); },
  saveUser(u: { id?: string | undefined; name: string; role: Role; active?: boolean }, pin?: string) {
    set((s) => {
      const fields = { name: u.name, role: u.role, active: u.active ?? true };
      const users: User[] = u.id
        ? s.users.map((x) => (x.id === u.id ? { ...x, ...fields, pinHash: pin ? hashPin(pin) : x.pinHash } : x))
        : [...s.users, { id: uid(), pinHash: hashPin(pin || "0000"), ...fields }];
      return { ...s, users, logs: log(s, u.id ? `Modification utilisateur ${u.name}${pin ? " (PIN réinitialisé)" : ""}` : `Création utilisateur ${u.name}`) };
    });
  },
  saveProduct(p: Omit<Product, "id"> & { id?: string }) {
    set((s) => ({
      ...s,
      products: p.id ? s.products.map((x) => (x.id === p.id ? { ...x, ...p } as Product : x)) : [...s.products, { ...p, id: uid() }],
      logs: log(s, `${p.id ? "Modification" : "Ajout"} produit ${p.name}`),
    }));
  },
  adjustQty(id: string, delta: number) {
    set((s) => ({ ...s, products: s.products.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty + delta) } : x)), logs: log(s, `Stock ${delta > 0 ? "+" : ""}${delta} sur ${s.products.find((x) => x.id === id)?.name}`) }));
  },
  deleteProduct(id: string) { set((s) => ({ ...s, products: s.products.filter((x) => x.id !== id), logs: log(s, "Suppression produit") })); },
  recordSale(sale: Omit<Sale, "id" | "number" | "date" | "userId" | "userName">): Sale {
    ensure();
    const u = currentUser(state)!;
    const full: Sale = { ...sale, id: uid(), number: "V-" + String(state.sales.length + 1).padStart(5, "0"), date: new Date().toISOString(), userId: u.id, userName: u.name };
    set((s) => ({
      ...s,
      sales: [full, ...s.sales],
      products: s.products.map((p) => { const it = sale.items.find((i) => i.productId === p.id); return it ? { ...p, qty: Math.max(0, p.qty - it.qty) } : p; }),
      logs: log(s, `Vente ${full.number} (${fcfa(full.total)})`),
    }));
    return full;
  },
  recordOrder(items: Order["items"]): Order {
    ensure();
    const u = currentUser(state)!;
    const d = new Date();
    const o: Order = { id: uid(), number: `BC-${d.getFullYear()}-${String(state.orders.length + 1).padStart(4, "0")}`, date: d.toISOString(), userName: u.name, items };
    set((s) => ({ ...s, orders: [o, ...s.orders], logs: log(s, `Bon de commande ${o.number}`) }));
    return o;
  },
};
