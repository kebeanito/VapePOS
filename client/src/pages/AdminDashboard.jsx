
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const BRANCHES = [
  "Red V",
  "Iyam",
  "Pleasantville",
  "M.L. Tagarao",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sales");

      setSales(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const todaySales = useMemo(() => {
    const today = new Date();

    return sales.filter((sale) => {
      if (!sale.createdAt) return false;

      const saleDate = new Date(sale.createdAt);

      return (
        !Number.isNaN(saleDate.getTime()) &&
        saleDate.getFullYear() === today.getFullYear() &&
        saleDate.getMonth() === today.getMonth() &&
        saleDate.getDate() === today.getDate()
      );
    });
  }, [sales]);

  const totalToday = todaySales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount ?? 0),
    0
  );

  const averageTransaction =
    todaySales.length > 0 ? totalToday / todaySales.length : 0;

  const allTimeSales = sales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount ?? 0),
    0
  );

  const branchStats = BRANCHES.map((branch) => {
    const branchSales = todaySales.filter(
      (sale) => sale.branch === branch
    );

    const total = branchSales.reduce(
      (sum, sale) => sum + Number(sale.totalAmount ?? 0),
      0
    );

    return {
      name: branch,
      total,
      transactions: branchSales.length,
    };
  });

  const highestBranch = [...branchStats].sort(
    (a, b) => b.total - a.total
  )[0];

  const recentSales = [...sales]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShoppingBag size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                VapePOS
              </h1>
              <p className="text-xs text-slate-500">
                Administration
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/sales")}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <BarChart3 size={17} />
            Manage Sales
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-6 lg:p-8">
        {/* Page title */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-violet-700">
              BUSINESS OVERVIEW
            </p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Monitor sales and performance across all branches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              <CalendarDays size={17} />
              {new Date().toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            <button
              onClick={loadSales}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Dashboard data unavailable</p>
              <p className="mt-1">{error}</p>
            </div>
            <button
              onClick={loadSales}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <CircleDollarSign size={23} />
              </div>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                Today
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Today's Sales
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {loading ? "..." : formatCurrency(totalToday)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Revenue from today's transactions
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ShoppingBag size={23} />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Transactions Today
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {loading ? "..." : todaySales.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Completed sales recorded today
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp size={23} />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Average Transaction
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {loading ? "..." : formatCurrency(averageTransaction)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Today's sales divided by transactions
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Activity size={23} />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              All-Time Sales
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {loading ? "..." : formatCurrency(allTimeSales)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Total of all recorded transactions
            </p>
          </div>
        </section>

        {/* Branch performance */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">
                Branch Performance
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Today's sales by branch.
              </p>
            </div>

            <Building2 size={22} className="text-slate-400" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {branchStats.map((branch) => {
              const share =
                totalToday > 0
                  ? (branch.total / totalToday) * 100
                  : 0;

              return (
                <div
                  key={branch.name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{branch.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {branch.transactions} transaction
                        {branch.transactions === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                      <Building2 size={18} />
                    </div>
                  </div>

                  <p className="mt-5 text-xl font-bold">
                    {loading ? "..." : formatCurrency(branch.total)}
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-600 transition-all"
                      style={{
                        width: `${Math.min(share, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {loading ? "Loading..." : `${share.toFixed(1)}% of today's sales`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent sales */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold">Recent Transactions</h3>
              <p className="mt-1 text-sm text-slate-500">
                The latest recorded sales across all branches.
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/sales")}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 sm:self-auto"
            >
              View All Sales
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading transactions...
            </div>
          ) : recentSales.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag
                size={32}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-semibold">
                No transactions yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Sales will appear here after a cashier completes a transaction.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Sale ID</th>
                    <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                    <th className="px-5 py-3 font-medium">Cashier</th>
                    <th className="px-5 py-3 font-medium">Branch</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        #{sale.id}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {sale.cashier || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {sale.branch || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {sale.paymentMethod || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <Clock size={14} />
            Dashboard figures are based on recorded sales data.
          </div>
        </section>

        {/* Branch highlight */}
        {!loading && totalToday > 0 && highestBranch && (
          <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-violet-700">
                <TrendingUp size={22} />
              </div>
              <div>
                <p className="font-semibold text-violet-950">
                  Top branch today: {highestBranch.name}
                </p>
                <p className="mt-1 text-sm text-violet-800">
                  {formatCurrency(highestBranch.total)} across{" "}
                  {highestBranch.transactions} transaction
                  {highestBranch.transactions === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/sales")}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 sm:self-auto"
            >
              Review sales
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
