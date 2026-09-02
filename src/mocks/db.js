const STORAGE_KEY = "invoice.mock.db.v1";

export function nextId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function seed() {
  const now = new Date().toISOString();

  const user = {
    id: "usr_owner",
    firstName: "Zain",
    lastName: "Ali",
    email: "owner@invoice.test",
    password: "Password123!",
    status: "active",
    createdAt: now,
    lastLoginAt: null,
  };

  const clients = [
    {
      id: "cli_ahmed",
      name: "Ahmed Khan",
      email: "ahmed@example.com",
      address: "Mall Road 12",
      city: "Lahore",
      code: "54000",
      country: "Pakistan",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cli_sara",
      name: "Sara Malik",
      email: "sara@example.com",
      address: "Clifton Block 5",
      city: "Karachi",
      code: "75600",
      country: "Pakistan",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const products = [
    {
      id: "prd_lipstick",
      sku: "COS-001",
      name: "Matte Lipstick",
      price: 1200,
      stock: 40,
      unit: "pcs",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prd_cream",
      sku: "COS-002",
      name: "Face Cream",
      price: 2500,
      stock: 25,
      unit: "pcs",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "prd_serum",
      sku: "COS-003",
      name: "Vitamin C Serum",
      price: 3200,
      stock: 15,
      unit: "pcs",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const inventoryMovements = products.map((product) => ({
    id: nextId("mov"),
    productId: product.id,
    type: "opening",
    quantity: product.stock,
    reason: "Opening stock",
    createdBy: user.id,
    createdAt: now,
  }));

  return {
    users: [user],
    sessions: [],
    clients,
    products,
    inventoryMovements,
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
  data: load(),
  commit() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },
  reset() {
    this.data = seed();
    this.commit();
  },
};
