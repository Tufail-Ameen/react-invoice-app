/**
 * Permission catalog — backend source of truth; frontend sirf UI hide/show.
 * Naming: resource.action (update not edit). Business "*" ≠ platform admin.
 */

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  CLIENTS_VIEW: "clients.view",
  CLIENTS_CREATE: "clients.create",
  CLIENTS_UPDATE: "clients.update",
  CLIENTS_DELETE: "clients.delete",

  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",

  INVENTORY_VIEW: "inventory.view",
  INVENTORY_ADJUST: "inventory.adjust",

  INVOICES_VIEW: "invoices.view",
  INVOICES_CREATE: "invoices.create",
  INVOICES_UPDATE: "invoices.update",
  INVOICES_DELETE: "invoices.delete",
  INVOICES_CONFIRM: "invoices.confirm",
  INVOICES_CHANGE_STATUS: "invoices.change_status",
  INVOICES_PRINT: "invoices.print",
  INVOICES_REVERSE: "invoices.reverse",

  ESTIMATES_VIEW: "estimates.view",
  ESTIMATES_CREATE: "estimates.create",
  ESTIMATES_UPDATE: "estimates.update",
  ESTIMATES_DELETE: "estimates.delete",
  ESTIMATES_CONVERT: "estimates.convert",

  CUSTOMER_PAYMENTS_VIEW: "customer_payments.view",
  CUSTOMER_PAYMENTS_CREATE: "customer_payments.create",
  CUSTOMER_LEDGER_VIEW: "customer_ledger.view",

  SALES_RETURNS_VIEW: "sales_returns.view",
  SALES_RETURNS_CREATE: "sales_returns.create",
  SALES_RETURNS_UPDATE: "sales_returns.update",
  SALES_RETURNS_CONFIRM: "sales_returns.confirm",
  SALES_RETURNS_CANCEL: "sales_returns.cancel",

  SUPPLIERS_VIEW: "suppliers.view",
  SUPPLIERS_CREATE: "suppliers.create",
  SUPPLIERS_UPDATE: "suppliers.update",
  SUPPLIERS_DELETE: "suppliers.delete",

  PURCHASES_VIEW: "purchases.view",
  PURCHASES_CREATE: "purchases.create",
  PURCHASES_UPDATE: "purchases.update",
  PURCHASES_DELETE: "purchases.delete",
  PURCHASES_CONFIRM: "purchases.confirm",
  PURCHASES_REVERSE: "purchases.reverse",

  PURCHASE_RETURNS_VIEW: "purchase_returns.view",
  PURCHASE_RETURNS_CREATE: "purchase_returns.create",
  PURCHASE_RETURNS_UPDATE: "purchase_returns.update",
  PURCHASE_RETURNS_CONFIRM: "purchase_returns.confirm",
  PURCHASE_RETURNS_CANCEL: "purchase_returns.cancel",

  SUPPLIER_PAYMENTS_VIEW: "supplier_payments.view",
  SUPPLIER_PAYMENTS_CREATE: "supplier_payments.create",
  SUPPLIER_LEDGER_VIEW: "supplier_ledger.view",

  EXPENSE_CATEGORIES_VIEW: "expense_categories.view",
  EXPENSE_CATEGORIES_CREATE: "expense_categories.create",
  EXPENSE_CATEGORIES_UPDATE: "expense_categories.update",
  EXPENSE_CATEGORIES_DELETE: "expense_categories.delete",

  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_UPDATE: "expenses.update",
  EXPENSES_DELETE: "expenses.delete",

  USERS_VIEW: "users.view",
  USERS_INVITE: "users.invite",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",

  BUSINESS_SETTINGS: "business.settings",
  BUSINESS_MANAGE_TEAM: "business.manage_team",

  SALESMEN_VIEW: "salesmen.view",
  SALESMEN_CREATE: "salesmen.create",
  SALESMEN_UPDATE: "salesmen.update",
  SALESMEN_ARCHIVE: "salesmen.archive",

  VISITS_VIEW: "visits.view",
  VISITS_CREATE: "visits.create",
  VISITS_UPDATE: "visits.update",
  VISITS_DELETE: "visits.delete",

  ORDERS_VIEW: "orders.view",
  ORDERS_VIEW_OWN: "orders.view_own",
  ORDERS_CREATE: "orders.create",
  ORDERS_UPDATE: "orders.update",
  ORDERS_SUBMIT: "orders.submit",
  ORDERS_CANCEL: "orders.cancel",
  ORDERS_CONVERT: "orders.convert",

  REPORTS_VIEW: "reports.view",

  PLATFORM_MANAGE_BUSINESSES: "platform.manage_businesses",
  AUDIT_VIEW: "audit.view",
};

export const PERMISSION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Business overview",
    permissions: [
      { key: PERMISSIONS.DASHBOARD_VIEW, label: "View dashboard" },
    ],
  },
  {
    key: "clients",
    label: "Clients",
    description: "Customer / client records",
    permissions: [
      { key: PERMISSIONS.CLIENTS_VIEW, label: "View clients" },
      { key: PERMISSIONS.CLIENTS_CREATE, label: "Create clients" },
      { key: PERMISSIONS.CLIENTS_UPDATE, label: "Update clients" },
      { key: PERMISSIONS.CLIENTS_DELETE, label: "Delete clients" },
    ],
  },
  {
    key: "catalog",
    label: "Products & Stock",
    description: "Products, categories, and inventory",
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: "View products" },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: "Create products" },
      { key: PERMISSIONS.PRODUCTS_UPDATE, label: "Update products" },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: "Delete products" },
      { key: PERMISSIONS.CATEGORIES_VIEW, label: "View categories" },
      { key: PERMISSIONS.CATEGORIES_CREATE, label: "Create categories" },
      { key: PERMISSIONS.CATEGORIES_UPDATE, label: "Update categories" },
      { key: PERMISSIONS.CATEGORIES_DELETE, label: "Delete categories" },
      { key: PERMISSIONS.INVENTORY_VIEW, label: "View inventory" },
      { key: PERMISSIONS.INVENTORY_ADJUST, label: "Adjust stock" },
    ],
  },
  {
    key: "invoices",
    label: "Invoices",
    description: "Billing lifecycle",
    permissions: [
      { key: PERMISSIONS.INVOICES_VIEW, label: "View invoices" },
      { key: PERMISSIONS.INVOICES_CREATE, label: "Create invoices" },
      { key: PERMISSIONS.INVOICES_UPDATE, label: "Update invoices" },
      { key: PERMISSIONS.INVOICES_DELETE, label: "Delete invoices" },
      { key: PERMISSIONS.INVOICES_CONFIRM, label: "Confirm invoices" },
      { key: PERMISSIONS.INVOICES_CHANGE_STATUS, label: "Change status" },
      { key: PERMISSIONS.INVOICES_PRINT, label: "Print invoices" },
      { key: PERMISSIONS.INVOICES_REVERSE, label: "Reverse invoices" },
      { key: PERMISSIONS.CUSTOMER_PAYMENTS_VIEW, label: "View customer payments" },
      { key: PERMISSIONS.CUSTOMER_PAYMENTS_CREATE, label: "Record customer payments" },
      { key: PERMISSIONS.CUSTOMER_LEDGER_VIEW, label: "View customer ledger" },
      { key: PERMISSIONS.SALES_RETURNS_VIEW, label: "View sales returns" },
      { key: PERMISSIONS.SALES_RETURNS_CREATE, label: "Create sales returns" },
      { key: PERMISSIONS.SALES_RETURNS_UPDATE, label: "Update sales returns" },
      { key: PERMISSIONS.SALES_RETURNS_CONFIRM, label: "Confirm sales returns" },
      { key: PERMISSIONS.SALES_RETURNS_CANCEL, label: "Cancel sales returns" },
    ],
  },
  {
    key: "estimates",
    label: "Estimates",
    description: "Quotes before invoicing",
    permissions: [
      { key: PERMISSIONS.ESTIMATES_VIEW, label: "View estimates" },
      { key: PERMISSIONS.ESTIMATES_CREATE, label: "Create estimates" },
      { key: PERMISSIONS.ESTIMATES_UPDATE, label: "Update estimates" },
      { key: PERMISSIONS.ESTIMATES_DELETE, label: "Delete estimates" },
      { key: PERMISSIONS.ESTIMATES_CONVERT, label: "Convert to invoice" },
    ],
  },
  {
    key: "salesmen",
    label: "Salesmen",
    description: "Field sales / order booker profiles",
    permissions: [
      { key: PERMISSIONS.SALESMEN_VIEW, label: "View salesmen" },
      { key: PERMISSIONS.SALESMEN_CREATE, label: "Create salesmen" },
      { key: PERMISSIONS.SALESMEN_UPDATE, label: "Update salesmen" },
      { key: PERMISSIONS.SALESMEN_ARCHIVE, label: "Archive salesmen" },
    ],
  },
  {
    key: "visits",
    label: "Visits",
    description: "Customer field visits",
    permissions: [
      { key: PERMISSIONS.VISITS_VIEW, label: "View visits" },
      { key: PERMISSIONS.VISITS_CREATE, label: "Create visits" },
      { key: PERMISSIONS.VISITS_UPDATE, label: "Update visits" },
      { key: PERMISSIONS.VISITS_DELETE, label: "Delete visits" },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    description: "Sales orders (draft → submit → convert to invoice; no stock until invoice confirm)",
    permissions: [
      { key: PERMISSIONS.ORDERS_VIEW, label: "View all orders" },
      { key: PERMISSIONS.ORDERS_VIEW_OWN, label: "View own orders" },
      { key: PERMISSIONS.ORDERS_CREATE, label: "Create orders" },
      { key: PERMISSIONS.ORDERS_UPDATE, label: "Update orders" },
      { key: PERMISSIONS.ORDERS_SUBMIT, label: "Submit orders" },
      { key: PERMISSIONS.ORDERS_CANCEL, label: "Cancel orders" },
      { key: PERMISSIONS.ORDERS_CONVERT, label: "Convert orders to invoice" },
    ],
  },
  {
    key: "purchasing",
    label: "Purchasing",
    description: "Suppliers, purchases, payments, and ledger",
    permissions: [
      { key: PERMISSIONS.SUPPLIERS_VIEW, label: "View suppliers" },
      { key: PERMISSIONS.SUPPLIERS_CREATE, label: "Create suppliers" },
      { key: PERMISSIONS.SUPPLIERS_UPDATE, label: "Update suppliers" },
      { key: PERMISSIONS.SUPPLIERS_DELETE, label: "Delete suppliers" },
      { key: PERMISSIONS.PURCHASES_VIEW, label: "View purchases" },
      { key: PERMISSIONS.PURCHASES_CREATE, label: "Create purchases" },
      { key: PERMISSIONS.PURCHASES_UPDATE, label: "Update purchases" },
      { key: PERMISSIONS.PURCHASES_DELETE, label: "Delete purchases" },
      { key: PERMISSIONS.PURCHASES_CONFIRM, label: "Confirm purchases" },
      { key: PERMISSIONS.PURCHASES_REVERSE, label: "Reverse purchases" },
      { key: PERMISSIONS.PURCHASE_RETURNS_VIEW, label: "View purchase returns" },
      { key: PERMISSIONS.PURCHASE_RETURNS_CREATE, label: "Create purchase returns" },
      { key: PERMISSIONS.PURCHASE_RETURNS_UPDATE, label: "Update purchase returns" },
      { key: PERMISSIONS.PURCHASE_RETURNS_CONFIRM, label: "Confirm purchase returns" },
      { key: PERMISSIONS.PURCHASE_RETURNS_CANCEL, label: "Cancel purchase returns" },
      { key: PERMISSIONS.SUPPLIER_PAYMENTS_VIEW, label: "View supplier payments" },
      { key: PERMISSIONS.SUPPLIER_PAYMENTS_CREATE, label: "Record supplier payments" },
      { key: PERMISSIONS.SUPPLIER_LEDGER_VIEW, label: "View supplier ledger" },
    ],
  },
  {
    key: "expenses",
    label: "Expenses",
    description: "Expense categories and records",
    permissions: [
      { key: PERMISSIONS.EXPENSE_CATEGORIES_VIEW, label: "View expense categories" },
      { key: PERMISSIONS.EXPENSE_CATEGORIES_CREATE, label: "Create expense categories" },
      { key: PERMISSIONS.EXPENSE_CATEGORIES_UPDATE, label: "Update expense categories" },
      { key: PERMISSIONS.EXPENSE_CATEGORIES_DELETE, label: "Archive expense categories" },
      { key: PERMISSIONS.EXPENSES_VIEW, label: "View expenses" },
      { key: PERMISSIONS.EXPENSES_CREATE, label: "Create expenses" },
      { key: PERMISSIONS.EXPENSES_UPDATE, label: "Update expenses" },
      { key: PERMISSIONS.EXPENSES_DELETE, label: "Void expenses" },
    ],
  },
  {
    key: "team",
    label: "Team & Access",
    description: "Staff and roles",
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: "View users" },
      { key: PERMISSIONS.USERS_INVITE, label: "Invite users" },
      { key: PERMISSIONS.USERS_UPDATE, label: "Update users" },
      { key: PERMISSIONS.USERS_DELETE, label: "Remove users" },
      { key: PERMISSIONS.ROLES_VIEW, label: "View roles" },
      { key: PERMISSIONS.ROLES_MANAGE, label: "Manage roles" },
      { key: PERMISSIONS.BUSINESS_MANAGE_TEAM, label: "Manage team" },
    ],
  },
  {
    key: "business",
    label: "Business",
    description: "Settings, reports, and audit",
    permissions: [
      { key: PERMISSIONS.BUSINESS_SETTINGS, label: "Business settings" },
      { key: PERMISSIONS.REPORTS_VIEW, label: "View reports" },
      { key: PERMISSIONS.AUDIT_VIEW, label: "View audit log" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    description: "Tenant management",
    permissions: [
      { key: PERMISSIONS.PLATFORM_MANAGE_BUSINESSES, label: "Manage businesses" },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

export function hasPermission(userPermissions, required) {
  if (!userPermissions?.length) return false;
  if (userPermissions.includes("*")) return true;
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((p) => userPermissions.includes(p));
}

export function hasEveryPermission(userPermissions, required) {
  if (!userPermissions?.length) return false;
  if (userPermissions.includes("*")) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.every((p) => userPermissions.includes(p));
}

/**
 * Platform access is deliberately outside the business-level "*" wildcard.
 * A platform admin must have an explicit flag or explicit platform permission.
 */
export function isPlatformAdminUser(user) {
  return (
    user?.isPlatformAdmin === true ||
    user?.permissions?.includes(PERMISSIONS.PLATFORM_MANAGE_BUSINESSES)
  );
}

export function hasUserPermission(user, required) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];

  return list.some((permission) =>
    permission === PERMISSIONS.PLATFORM_MANAGE_BUSINESSES
      ? isPlatformAdminUser(user)
      : hasPermission(user?.permissions, permission)
  );
}

export function hasEveryUserPermission(user, required) {
  const list = Array.isArray(required) ? required : [required];
  return list.every((permission) => hasUserPermission(user, permission));
}
