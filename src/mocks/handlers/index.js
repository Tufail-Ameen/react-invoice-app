import { authHandlers } from "./auth";
import { clientsHandlers } from "./clients";
import { inventoryHandlers } from "./inventory";
import { invoicesHandlers } from "./invoices";
import { productsHandlers } from "./products";

export const handlers = [
  ...authHandlers,
  ...clientsHandlers,
  ...productsHandlers,
  ...inventoryHandlers,
  ...invoicesHandlers,
];
