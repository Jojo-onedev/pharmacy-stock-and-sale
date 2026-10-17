import { describe, expect, it } from "vitest";
import { computePayment } from "@/lib/payment";

describe("computePayment", () => {
  it("espèces : rend la monnaie", () => {
    expect(computePayment(3750, "cash", 5000, 0)).toMatchObject({ change: 1250, valid: true });
  });
  it("espèces insuffisantes : invalide", () => {
    expect(computePayment(3750, "cash", 3000, 0).valid).toBe(false);
  });
  it("mixte : momo + espèces, monnaie sur la part espèces", () => {
    expect(computePayment(10000, "mixte", 5000, 6000)).toMatchObject({ cash: 4000, momo: 6000, change: 1000, valid: true });
  });
  it("mobile money : montant exact, pas de monnaie", () => {
    expect(computePayment(2500, "momo", 0, 0)).toMatchObject({ momo: 2500, change: 0, valid: true });
  });
});
