import { Navigate, Route, Routes } from "react-router-dom";
import { GuestOnly, RequireAuth } from "../auth/guards";
import DashboardLayout from "../layouts/DashboardLayout";
import ClientsPage from "../pages/ClientsPage";
import InvoiceDetailPage from "../pages/InvoiceDetailPage";
import InvoicesPage from "../pages/InvoicesPage";
import LoginPage from "../pages/LoginPage";
import StockPage from "../pages/StockPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
