import { catalogSelection, itemsFromRateList, productDefaultPrice, toMoneyNumber } from "./rateLists";

describe("productDefaultPrice", () => {
  test("uses salePrice first", () => {
    expect(productDefaultPrice({ salePrice: 120, wholesalePrice: 90 })).toBe(120);
  });

  test("skips zero salePrice and uses wholesale", () => {
    expect(productDefaultPrice({ salePrice: 0, wholesalePrice: 250 })).toBe(250);
  });

  test("reads snake_case sale_price", () => {
    expect(productDefaultPrice({ sale_price: "1,250" })).toBe(1250);
  });

  test("reads nested amount objects", () => {
    expect(productDefaultPrice({ salePrice: { amount: 80 } })).toBe(80);
  });
});

describe("itemsFromRateList", () => {
  test("fills missing custom rate from default", () => {
    const selected = itemsFromRateList({
      items: [{ productId: 1, productName: "Cap", defaultPrice: 40 }],
    });
    expect(selected["1"].customPrice).toBe(40);
  });
});

describe("catalogSelection", () => {
  test("builds items with catalog rates", () => {
    const selected = catalogSelection([
      { id: 4, name: "Archi Cap", sku: "PRD-0007", unit: "pcs", salePrice: 45 },
    ]);
    expect(selected["4"]).toMatchObject({
      productId: 4,
      customPrice: 45,
      defaultPrice: 45,
    });
  });
});

describe("toMoneyNumber", () => {
  test("returns null for empty values", () => {
    expect(toMoneyNumber(null)).toBe(null);
    expect(toMoneyNumber("")).toBe(null);
  });
});
