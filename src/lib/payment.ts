import type { PayMode } from "./store";

/** Calcule la répartition d'un règlement. momo = part Mobile Money, received = espèces reçues. */
export function computePayment(total: number, mode: PayMode, received: number, momo: number) {
  if (mode === "momo") return { cash: 0, momo: total, change: 0, valid: total > 0 };
  if (mode === "cash") {
    const change = received - total;
    return { cash: total, momo: 0, change: Math.max(0, change), valid: total > 0 && change >= 0 };
  }
  const cashDue = total - momo;
  const change = received - cashDue;
  return { cash: cashDue, momo, change: Math.max(0, change), valid: total > 0 && momo > 0 && momo < total && change >= 0 };
}
