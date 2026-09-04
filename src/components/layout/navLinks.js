import {
  faBoxesStacked,
  faBuilding,
  faClipboardList,
  faFileInvoice,
  faShieldHalved,
  faUserGroup,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { PERMISSIONS } from "../../lib/permissions";

/** Main business work — permission se filter hota hai. */
export const mainNavLinks = [
  {
    to: "/",
    label: "Invoices",
    icon: faFileInvoice,
    end: true,
    permission: PERMISSIONS.INVOICES_VIEW,
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
  const all = [...mainNavLinks, ...teamNavLinks, ...platformNavLinks];
  const match = all.find((link) =>
    link.end ? pathname === link.to : pathname.startsWith(link.to)
  );
  return match?.label ?? "Dashboard";
}

export function filterNavByPermission(links, can) {
  return links.filter((link) => !link.permission || can(link.permission));
}
