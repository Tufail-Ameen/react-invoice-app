import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import BottomNav from "../components/layout/BottomNav";
import MobileHeader from "../components/layout/MobileHeader";
import Sidebar from "../components/layout/Sidebar";
import { printclientdata, productAtom } from "../state/Atom";

export default function DashboardLayout() {
  const setProduct = useSetRecoilState(productAtom);
  const setClients = useSetRecoilState(printclientdata);

  useEffect(() => {
    const invoices = JSON.parse(localStorage.getItem("invoiceData")) || [];
    const clients = JSON.parse(localStorage.getItem("clientData")) || [];
    setProduct(invoices);
    setClients(clients);
  }, [setProduct, setClients]);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <MobileHeader />
        <main className="app-content">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
