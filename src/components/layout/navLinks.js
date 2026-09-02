import { faBoxesStacked, faFileInvoice, faUsers } from "@fortawesome/free-solid-svg-icons";

export const navLinks = [
  { to: "/", label: "Invoices", icon: faFileInvoice, end: true },
  { to: "/clients", label: "Clients", icon: faUsers },
  { to: "/stock", label: "Products & Stock", icon: faBoxesStacked },
];

export function getNavPageTitle(pathname) {
  if (pathname.startsWith("/invoices/")) return "Invoice Details";
  const match = navLinks.find((link) =>
    link.end ? pathname === link.to : pathname.startsWith(link.to),
  );
  return match?.label ?? "Dashboard";
}
