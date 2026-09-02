/** Normalize real Express /products records (`_id` + numeric `id`). */
function calcNetRate(tpRate, discountPercent) {
  const tp = Number(tpRate);
  const pct = Number(discountPercent);
  if (!Number.isFinite(tp) || tp < 0) return null;
  if (!Number.isFinite(pct) || pct < 0) return tp;
  return Math.round(tp * (1 - pct / 100) * 100) / 100;
}

export function normalizeProduct(product) {
  if (!product) return product;
  const tpRate = product.tpRate ?? null;
  const discountPercent = product.discountPercent ?? null;
  const netRate =
    product.netRate ??
    (tpRate != null && discountPercent != null
      ? calcNetRate(tpRate, discountPercent)
      : null);

  return {
    ...product,
    key: product._id || String(product.id),
    id: product.id,
    _id: product._id,
    category: product.category ?? "",
    tpRate,
    discountPercent,
    netRate,
    printRate: product.printRate ?? product.price ?? null,
    price: product.price ?? product.printRate ?? null,
  };
}

export function normalizeProductsResponse(response) {
  const list = Array.isArray(response)
    ? response
    : response?.products ?? response?.data ?? [];
  return {
    products: list.map(normalizeProduct),
    meta: response?.meta,
  };
}
