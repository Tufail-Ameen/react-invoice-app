import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import ClientsPage from "../pages/ClientsPage";
import InvoiceDetailPage from "../pages/InvoiceDetailPage";
import InvoicesPage from "../pages/InvoicesPage";
import StockPage from "../pages/StockPage";
import UsersPage from "../pages/UsersPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<InvoicesPage />} />
        <Route path="/invoices/:index" element={<InvoiceDetailPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
