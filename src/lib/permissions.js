/**
 * Permission catalog — backend source of truth; frontend sirf UI hide/show.
 */

export const PERMISSIONS = {
  CLIENTS_VIEW: "clients.view",
  CLIENTS_CREATE: "clients.create",
  CLIENTS_UPDATE: "clients.update",
  CLIENTS_DELETE: "clients.delete",

  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_ADJUST: "inventory.adjust",

  INVOICES_VIEW: "invoices.view",
  INVOICES_CREATE: "invoices.create",
  INVOICES_UPDATE: "invoices.update",
  INVOICES_DELETE: "invoices.delete",
  INVOICES_CHANGE_STATUS: "invoices.change_status",

  USERS_VIEW: "users.view",
  USERS_INVITE: "users.invite",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",

  BUSINESS_SETTINGS: "business.settings",
  BUSINESS_MANAGE_TEAM: "business.manage_team",

  PLATFORM_MANAGE_BUSINESSES: "platform.manage_businesses",
  AUDIT_VIEW: "audit.view",
};

export const PERMISSION_GROUPS = [
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
    description: "Products and inventory",
    permissions: [
      { key: PERMISSIONS.PRODUCTS_VIEW, label: "View products" },
      { key: PERMISSIONS.PRODUCTS_CREATE, label: "Create products" },
      { key: PERMISSIONS.PRODUCTS_UPDATE, label: "Update products" },
      { key: PERMISSIONS.PRODUCTS_DELETE, label: "Delete products" },
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
      { key: PERMISSIONS.INVOICES_CHANGE_STATUS, label: "Change status" },
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
    description: "Settings and audit",
    permissions: [
      { key: PERMISSIONS.BUSINESS_SETTINGS, label: "Business settings" },
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
