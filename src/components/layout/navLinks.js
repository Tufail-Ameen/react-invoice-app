import {
  faBoxesStacked,
  faBuilding,
  faCartShopping,
  faClipboardList,
  faFileInvoice,
  faFileLines,
  faClipboardCheck,
  faMapLocationDot,
  faMoneyBillWave,
  faRotateLeft,
  faShieldHalved,
  faTruck,
  faTruckRampBox,
  faUserGroup,
  faUserTie,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { PERMISSIONS } from "../../lib/permissions";

/** Main business work — permission se filter hota hai. */
export const mainNavLinks = [
  {
    to: "/invoices",
    label: "Invoices",
    icon: faFileInvoice,
    end: true,
    permission: PERMISSIONS.INVOICES_VIEW,
  },
  {
    to: "/estimates",
    label: "Estimates",
    icon: faFileLines,
    permission: PERMISSIONS.ESTIMATES_VIEW,
  },
  {
    to: "/orders",
    label: "Orders",
    icon: faClipboardCheck,
    permissions: [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_VIEW_OWN],
  },
  {
    to: "/salesmen",
    label: "Salesmen",
    icon: faUserTie,
    permission: PERMISSIONS.SALESMEN_VIEW,
  },
  {
    to: "/visits",
    label: "Visits",
    icon: faMapLocationDot,
    permission: PERMISSIONS.VISITS_VIEW,
  },
  {
    to: "/sales-returns",
    label: "Sales Returns",
    icon: faRotateLeft,
    permission: PERMISSIONS.SALES_RETURNS_VIEW,
  },
  {
    to: "/clients",
    label: "Clients",
    icon: faUsers,
    permission: PERMISSIONS.CLIENTS_VIEW,
  },
  {
    to: "/stock",
    label: "Products & Stock",
    icon: faBoxesStacked,
    permission: PERMISSIONS.PRODUCTS_VIEW,
  },
  {
    to: "/suppliers",
    label: "Suppliers",
    icon: faTruck,
    permission: PERMISSIONS.SUPPLIERS_VIEW,
  },
  {
    to: "/purchases",
    label: "Purchases",
    icon: faCartShopping,
    permission: PERMISSIONS.PURCHASES_VIEW,
  },
  {
    to: "/purchase-returns",
    label: "Purchase Returns",
    icon: faTruckRampBox,
    permission: PERMISSIONS.PURCHASE_RETURNS_VIEW,
  },
  {
    to: "/expenses",
    label: "Expenses",
    icon: faMoneyBillWave,
    permission: PERMISSIONS.EXPENSES_VIEW,
  },
];

/** Business ke andar team management. */
export const teamNavLinks = [
  {
    to: "/team/users",
    label: "Team Users",
    icon: faUserGroup,
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    to: "/team/roles",
    label: "Roles",
    icon: faShieldHalved,
    permission: PERMISSIONS.ROLES_VIEW,
  },
  {
    to: "/team/audit",
    label: "Audit Log",
    icon: faClipboardList,
    permission: PERMISSIONS.AUDIT_VIEW,
  },
];

/** Platform Super Admin only. */
export const platformNavLinks = [
  {
    to: "/platform/businesses",
    label: "Businesses",
    icon: faBuilding,
    permission: PERMISSIONS.PLATFORM_MANAGE_BUSINESSES,
  },
];

/** @deprecated use mainNavLinks — BottomNav compatibility */
export const navLinks = mainNavLinks;

export function getNavPageTitle(pathname) {
  if (pathname.startsWith("/invoices/")) return "Invoice Details";
  if (pathname.startsWith("/clients/") && pathname !== "/clients") {
    return "Client Details";
  }
  if (pathname === "/estimates/new") return "New Estimate";
  if (/^\/estimates\/[^/]+\/edit$/.test(pathname)) return "Edit Estimate";
  if (pathname.startsWith("/estimates/") && pathname !== "/estimates") {
    return "Estimate Details";
  }
  if (pathname === "/orders/new") return "New Order";
  if (/^\/orders\/[^/]+\/edit$/.test(pathname)) return "Edit Order";
  if (pathname.startsWith("/orders/") && pathname !== "/orders") {
    return "Order Details";
  }
  if (pathname.startsWith("/salesmen/") && pathname !== "/salesmen") {
    return "Salesman Details";
  }
  if (pathname === "/visits/new") return "New Visit";
  if (pathname.startsWith("/visits/") && pathname !== "/visits") {
    return "Visit Details";
  }
  if (pathname === "/sales-returns/new") return "New Sales Return";
  if (pathname.startsWith("/sales-returns/") && pathname !== "/sales-returns") {
    return "Sales Return Details";
  }
  if (pathname.startsWith("/suppliers/") && pathname !== "/suppliers") {
    return "Supplier Details";
  }
  if (pathname === "/purchases/new") return "New Purchase";
  if (/^\/purchases\/[^/]+\/edit$/.test(pathname)) return "Edit Purchase";
  if (pathname.startsWith("/purchases/") && pathname !== "/purchases") {
    return "Purchase Details";
  }
  if (pathname === "/purchase-returns/new") return "New Purchase Return";
  if (
    pathname.startsWith("/purchase-returns/") &&
    pathname !== "/purchase-returns"
  ) {
    return "Purchase Return Details";
  }
  if (pathname === "/expenses/new") return "New Expense";
  if (/^\/expenses\/[^/]+\/edit$/.test(pathname)) return "Edit Expense";
  if (pathname.startsWith("/expenses/") && pathname !== "/expenses") {
    return "Expense Details";
  }
  const all = [...mainNavLinks, ...teamNavLinks, ...platformNavLinks];
  const match = all.find((link) =>
    link.end ? pathname === link.to : pathname.startsWith(link.to)
  );
  return match?.label ?? "Dashboard";
}

/**
 * Filter nav links by permission.
 * Supports `permission` (single) or `permissions` (any-of array).
 */
export function filterNavByPermission(links, can) {
  return links.filter((link) => {
    if (Array.isArray(link.permissions) && link.permissions.length) {
      return link.permissions.some((p) => can(p));
    }
    return !link.permission || can(link.permission);
  });
}
