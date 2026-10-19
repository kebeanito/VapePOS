
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  ShoppingBag,
  CircleDollarSign,
  AlertCircle,
} from "lucide-react";
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
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sales");
      setSales(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load sales. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !query ||
        String(sale.id).includes(query) ||
        (sale.cashier || "").toLowerCase().includes(query);

      const matchesBranch =
        branchFilter === "ALL" || sale.branch === branchFilter;

      const matchesPayment =
        paymentFilter === "ALL" ||
        sale.paymentMethod === paymentFilter;

      return matchesSearch && matchesBranch && matchesPayment;
    });
  }, [sales, search, branchFilter, paymentFilter]);

  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount ?? 0),
    0
  );

  return (
    <div className="min-h-screen min-w-0 bg-slate-100 text-slate-900">
      <main className="mx-auto w-full max-w-7xl space-y-5 p-3 sm:space-y-6 sm:p-6 lg:p-8">
        {/* Page heading */}
        <section className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
              Administration
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Sales Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor transactions from all branches.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSales}
            disabled={loading}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </section>

        {/* Summary cards */}
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShoppingBag size={18} className="shrink-0" />
              Transactions
            </div>
            <p className="mt-3 break-words text-2xl font-bold sm:text-3xl">
              {loading ? "..." : filteredSales.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on current filters
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CircleDollarSign size={18} className="shrink-0" />
              Sales total
            </div>
            <p className="mt-3 break-words text-xl font-bold sm:text-2xl">
              {loading ? "..." : formatCurrency(totalSales)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on current filters
            </p>
          </div>
        </section>

        {/* Sales table and filters */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-slate-200 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
            <div className="relative min-w-0">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sale ID or cashier..."
                aria-label="Search by sale ID or cashier"
                className="w-full min-w-0 rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              aria-label="Filter by branch"
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="ALL">All branches</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              aria-label="Filter by payment method"
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="ALL">All payment methods</option>
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          {error && (
            <div className="m-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:m-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="min-w-0 break-words">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500 sm:p-12">
              Loading sales...
            </div>
          ) : error && sales.length === 0 ? (
            <div className="p-10 text-center sm:p-12">
              <p className="text-sm text-slate-500">
                Sales could not be loaded.
              </p>
              <button
                type="button"
                onClick={loadSales}
                className="mt-3 text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                Try again
              </button>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 sm:p-12">
              No transactions found. Try changing your filters.
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                      Sale ID
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                      Date &amp; Time
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                      Cashier
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                      Branch
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                      Payment
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-slate-50"
                    >
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

          {/* Table footer */}
          <div className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              Showing {filteredSales.length} of {sales.length} transactions
            </span>
            <span>Totals reflect the current filters.</span>
          </div>
        </section>
      </main>
    </div>
  );
}
