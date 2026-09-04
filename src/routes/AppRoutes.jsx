import { Navigate, Route, Routes } from "react-router-dom";
import { GuestOnly, RequireAuth, RequirePermission } from "../auth/guards";
import DashboardLayout from "../layouts/DashboardLayout";
import { PERMISSIONS } from "../lib/permissions";
import ClientsPage from "../pages/ClientsPage";
import ForbiddenPage from "../pages/ForbiddenPage";
import InvoiceDetailPage from "../pages/InvoiceDetailPage";
import InvoicesPage from "../pages/InvoicesPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import StockPage from "../pages/StockPage";
import PlatformBusinessesPage from "../pages/platform/PlatformBusinessesPage";
import AuditLogPage from "../pages/team/AuditLogPage";
import TeamRolesPage from "../pages/team/TeamRolesPage";
import TeamUsersPage from "../pages/team/TeamUsersPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/"
            element={
              <RequirePermission permission={PERMISSIONS.INVOICES_VIEW}>
                <InvoicesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <RequirePermission permission={PERMISSIONS.INVOICES_VIEW}>
                <InvoiceDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/clients"
            element={
              <RequirePermission permission={PERMISSIONS.CLIENTS_VIEW}>
                <ClientsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/stock"
            element={
              <RequirePermission permission={PERMISSIONS.PRODUCTS_VIEW}>
                <StockPage />
              </RequirePermission>
            }
          />

          <Route
            path="/team/users"
            element={
              <RequirePermission permission={PERMISSIONS.USERS_VIEW}>
                <TeamUsersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/team/roles"
            element={
              <RequirePermission permission={PERMISSIONS.ROLES_VIEW}>
                <TeamRolesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/team/audit"
            element={
              <RequirePermission permission={PERMISSIONS.AUDIT_VIEW}>
                <AuditLogPage />
              </RequirePermission>
            }
          />

          <Route
            path="/platform/businesses"
            element={
              <RequirePermission permission={PERMISSIONS.PLATFORM_MANAGE_BUSINESSES}>
                <PlatformBusinessesPage />
              </RequirePermission>
            }
          />

          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
