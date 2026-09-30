import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, []);

  const loadAssignment = async () => {
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
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
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

            <span className="text-lg font-bold">
              VapePOS
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => console.log("POS coming next")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ShoppingCart size={19} />
            POS
          </button>

          <button
            onClick={() => console.log("Inventory coming next")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <Boxes size={19} />
            Inventory
          </button>

          <button
            onClick={() => console.log("Sales coming next")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <BarChart3 size={19} />
            Sales
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
          <div className="mb-3 rounded-lg bg-slate-900 p-3">
            <p className="truncate text-sm font-medium">
              {user?.fullName}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Cashier
            </p>
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
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="text-xs text-slate-500">
                Current Branch
              </p>

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
              {user?.fullName}
            </p>

            <p className="text-xs text-slate-500">
              Cashier
            </p>
          </div>
        </header>

        {/* Dashboard */}
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here's an overview of your branch for today.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Today's Sales"
              value="₱0.00"
              icon={<CircleDollarSign size={22} />}
            />

            <StatCard
              title="Items Sold"
              value="0"
              icon={<ShoppingCart size={22} />}
            />

            <StatCard
              title="Products"
              value="0"
              icon={<Package size={22} />}
            />

            <StatCard
              title="Low Stock"
              value="0"
              icon={<Boxes size={22} />}
            />
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ShoppingCart size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Point of Sale
                  </h2>

                  <p className="text-sm text-slate-500">
                    Start a new transaction.
                  </p>
                </div>
              </div>

              <button
                onClick={() => console.log("POS coming next")}
                className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open POS
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Boxes size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Inventory
                  </h2>

                  <p className="text-sm text-slate-500">
                    Check and manage branch stock.
                  </p>
                </div>
              </div>

              <button
                onClick={() => console.log("Inventory coming next")}
                className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View Inventory
              </button>
            </div>
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
                  You are currently assigned to{" "}
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

      <p className="mt-4 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default CashierDashboard;