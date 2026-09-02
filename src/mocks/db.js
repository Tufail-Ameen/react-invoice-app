const STORAGE_KEY = "invoice.mock.db.v1";

export function nextId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Empty seed — dummy Ahmed/Sara clients hata diye. Sirf mock mode ke liye. */
function seed() {
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: "usr_owner",
        firstName: "Zain",
        lastName: "Ali",
        email: "owner@invoice.test",
        password: "Password123!",
        status: "active",
        createdAt: now,
        lastLoginAt: null,
      },
    ],
    sessions: [],
    clients: [],
    products: [],
    inventoryMovements: [],
    invoices: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    if (!parsed?.users?.length) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

export const db = {
  data: typeof localStorage !== "undefined" ? load() : seed(),
  commit() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },
  reset() {
    this.data = seed();
    this.commit();
  },
};
