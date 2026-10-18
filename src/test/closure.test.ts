import { describe, expect, it } from "vitest";
import { available, summarizeSales } from "@/lib/closure";
import { computePayment } from "@/lib/payment";

const sales = [
  { total: 5000, cash: 5000, momo: 0 },
  { total: 10000, cash: 4000, momo: 6000 },
];

describe("arrêt de compte", () => {
  it("détaille total, espèces et mobile money", () => {
    expect(summarizeSales(sales)).toMatchObject({ count: 2, total: 15000, cash: 9000, momo: 6000, expectedCash: 9000 });
  });
  it("signale un surplus en caisse", () => {
    expect(summarizeSales(sales, 9500).diff).toBe(500);
  });
  it("signale un manquant en caisse", () => {
    expect(summarizeSales(sales, 8000).diff).toBe(-1000);
  });
});

describe("stock disponible", () => {
  it("vendable jusqu'à épuisement en tenant compte des tickets en attente", () => {
    expect(available(3, 2)).toBe(1);
    expect(available(3, 3)).toBe(0);
  });
});

describe("paiement mixte pré-rempli", () => {
  it("reste en espèces = total - mobile money, validable directement", () => {
    expect(computePayment(10000, "mixte", 10000 - 6000, 6000)).toMatchObject({ cash: 4000, change: 0, valid: true });
  });
});
