import { formatAmount } from "../utils/invoice";

export function unwrapRateList(response) {
  if (!response) return null;
  return response.rateList ?? response;
}

export function unwrapRateLists(response) {
  if (!response) return { rateLists: [], pagination: undefined };
  if (Array.isArray(response)) {
    return { rateLists: response, pagination: undefined };
  }
  return {
    rateLists: response.rateLists || response.items || [],
    pagination: response.pagination,
  };
}

export function productDefaultPrice(product) {
  const value = product?.salePrice ?? product?.printRate ?? product?.price ?? 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function rateListStatus(list) {
  return String(list?.status || "DRAFT").toUpperCase();
}

export function getShareToken(rateList) {
  if (rateList?.shareToken) return rateList.shareToken;
  const path = rateList?.sharePath;
  if (!path) return null;
  const parts = String(path).split("/").filter(Boolean);
  return parts[parts.length - 1] || null;
}

export function getRateListShareUrl(rateList) {
  const token = getShareToken(rateList);
  if (!token) return null;
  return `${window.location.origin}/share/rate-lists/${token}`;
}

export function priceDelta(customPrice, defaultPrice) {
  return Number(customPrice || 0) - Number(defaultPrice || 0);
}

export function formatPrice(amount) {
  return formatAmount("Rs", amount);
}

export function formatDelta(customPrice, defaultPrice) {
  const delta = priceDelta(customPrice, defaultPrice);
  if (!delta) return { text: "—", tone: "flat" };
  const sign = delta > 0 ? "+" : "−";
  return {
    text: `${sign}${formatAmount("Rs", Math.abs(delta))}`,
    tone: delta > 0 ? "up" : "down",
  };
}

export function buildRateListItems(selected) {
  return Object.values(selected).map((item) => {
    const payload = { productId: Number(item.productId) };
    const custom = Number(item.customPrice);
    if (item.customPrice !== "" && Number.isFinite(custom) && custom >= 0) {
      payload.customPrice = custom;
    }
    return payload;
  });
}

export function itemsFromRateList(list) {
  const next = {};
  for (const item of list?.items || []) {
    const id = String(item.productId);
    next[id] = {
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      unit: item.unit,
      defaultPrice: item.defaultPrice,
      customPrice: item.customPrice ?? item.defaultPrice,
    };
  }
  return next;
}

export function itemFromProduct(product) {
  const defaultPrice = productDefaultPrice(product);
  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    unit: product.unit || "pcs",
    defaultPrice,
    customPrice: defaultPrice,
  };
}

export function shareMessage(rateList) {
  const title = rateList?.title || "Rate list";
  const client = rateList?.clientName ? ` for ${rateList.clientName}` : "";
  return `${title}${client}`;
}

export function whatsappShareHref(message, shareUrl) {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${shareUrl}`)}`;
}

export function mailtoShareHref(rateList, shareUrl) {
  const subject = rateList?.title || "Rate list";
  const body = `${shareMessage(rateList)}\n${shareUrl}`;
  const email = rateList?.clientEmail || "";
  const prefix = email ? `mailto:${encodeURIComponent(email)}` : "mailto:";
  return `${prefix}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyText(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
