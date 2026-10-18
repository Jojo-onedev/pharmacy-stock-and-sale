/** Résumé d'un arrêt de compte : totaux espèces / mobile money et écart de caisse. */
export function summarizeSales(sales: { total: number; cash: number; momo: number }[], counted?: number) {
  const total = sales.reduce((a, s) => a + s.total, 0);
  const cash = sales.reduce((a, s) => a + s.cash, 0);
  const momo = sales.reduce((a, s) => a + s.momo, 0);
  const expectedCash = cash;
  const diff = counted === undefined ? 0 : counted - expectedCash;
  return { count: sales.length, total, cash, momo, expectedCash, diff };
}

/** Quantité encore disponible d'un produit, une fois déduits les tickets en attente et le panier. */
export function available(stock: number, reserved: number) {
  return Math.max(0, stock - reserved);
}
