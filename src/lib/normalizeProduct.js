/** Normalize real Express /products records (`_id` + numeric `id`). */
export function normalizeProduct(product) {
  if (!product) return product;
  return {
    ...product,
    key: product._id || String(product.id),
    id: product.id,
    _id: product._id,
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
