
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Store,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [salesData, setSalesData] = useState({
    totalSales: 0,
    transactionCount: 0,
    recentSales: [],
  });
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState("");

  const loadAssignment = useCallback(async () => {
    try {
      const response = await api.get("/assignments/today");

      if (!response.data?.assigned) {
        navigate("/cashier/select-branch", { replace: true });
        return;
      }

      setAssignment(response.data);
    } catch (error) {
      console.error("Failed to load assignment:", error);
      navigate("/cashier/select-branch", { replace: true });
    } finally {
      setAssignmentLoading(false);
    }
  }, [navigate]);

  const loadTodaySales = useCallback(async () => {
    setSalesLoading(true);
    setSalesError("");

    try {
      const response = await api.get("/sales/today");

      setSalesData({
        totalSales: Number(response.data?.totalSales ?? 0),
        transactionCount: Number(response.data?.transactionCount ?? 0),
        recentSales: Array.isArray(response.data?.recentSales)
          ? response.data.recentSales
          : [],
      });
    } catch (error) {
      console.error("Failed to load today's sales:", error);

      setSalesError(
        error.response?.data?.message ||
          "Unable to load today's sales. Please try again."
      );
    } finally {
      setSalesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  useEffect(() => {
    loadTodaySales();
  }, [loadTodaySales]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (assignmentLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-sm text-slate-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const branchName =
    assignment?.branchName ||
    assignment?.branch?.name ||
    "Assigned Branch";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-950 text-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950">
              VP
            </div>
            <span className="text-lg font-bold">VapePOS</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="text-slate-400 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1 p-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            onClick={() => navigate("/cashier/pos")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ShoppingCart size={19} />
            POS
          </button>

          <button
            onClick={() => navigate("/cashier/inventory")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Boxes size={19} />
              Inventory
          </button>

          <button
            onClick={() => navigate("/cashier/sales")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
            <BarChart3 size={19} />
            Sales
        </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
          <div className="mb-3 rounded-lg bg-slate-900 p-3">
            <p className="truncate text-sm font-medium">
              {user?.fullName || user?.username || "Cashier"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Cashier</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="text-slate-600 lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="text-xs text-slate-500">Current Branch</p>
              <div className="flex items-center gap-2">
                <Store size={16} className="text-slate-700" />
                <span className="text-sm font-semibold text-slate-900">
                  {branchName}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-slate-500">Cashier</p>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Here's an overview of your branch for today.
              </p>
            </div>

            <button
              onClick={loadTodaySales}
              disabled={salesLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={salesLoading ? "animate-spin" : ""}
              />
              Refresh sales
            </button>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Today's Sales"
              value={salesLoading ? "Loading..." : formatCurrency(salesData.totalSales)}
              icon={<CircleDollarSign size={22} />}
            />

            <StatCard
              title="Transactions"
              value={salesLoading ? "Loading..." : salesData.transactionCount}
              icon={<ShoppingCart size={22} />}
            />

            <StatCard
              title="Products"
              value="—"
              icon={<Package size={22} />}
            />

            <StatCard
              title="Low Stock"
              value="—"
              icon={<Boxes size={22} />}
            />
          </div>

          {salesError && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{salesError}</p>
              </div>

              <button
                onClick={loadTodaySales}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          )}

          {/* Recent sales */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Recent Sales
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Today's transactions for {branchName}.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {salesData.transactionCount} transactions
              </span>
            </div>

            {salesLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading recent sales...
              </div>
            ) : salesError ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Recent sales could not be loaded.
              </div>
            ) : salesData.recentSales.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <ShoppingCart size={22} />
                </div>
                <p className="mt-3 font-medium text-slate-800">
                  No sales yet today
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Completed transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Sale ID</th>
                      <th className="px-5 py-3 font-medium">Cashier</th>
                      <th className="px-5 py-3 font-medium">Payment</th>
                      <th className="px-5 py-3 font-medium">Time</th>
                      <th className="px-5 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesData.recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                          #{sale.id}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {sale.cashier || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {sale.paymentMethod || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatTime(sale.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quick actions */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ActionCard
              title="Point of Sale"
              description="Start a new transaction."
              buttonText="Open POS"
              icon={<ShoppingCart size={21} />}
              onClick={() => navigate("/cashier/pos")}
            />

            <ActionCard
              title="Inventory"
              description="Check and manage branch stock."
              buttonText="View Inventory"
              icon={<Boxes size={21} />}
              onClick={() => navigate("/cashier/inventory")}
              secondary
            />
          </div>

          {/* Branch information */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Store size={21} className="text-slate-700" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Today's Assignment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  You are assigned to{" "}
                  <span className="font-medium text-slate-700">
                    {branchName}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-1 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  buttonText,
  icon,
  onClick,
  secondary = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            secondary
              ? "bg-slate-100 text-slate-700"
              : "bg-slate-900 text-white"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className={`mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
          secondary
            ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default CashierDashboard;
