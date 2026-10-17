
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  ShoppingBag,
  CircleDollarSign,
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
  const navigate = useNavigate();

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
        branchFilter === "ALL" ||
        sale.branch === branchFilter;

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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-xl font-bold">VapePOS</h1>
          <p className="text-xs text-slate-500">
            Admin Sales Management
          </p>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Sales</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor transactions from all branches.
            </p>
          </div>

          <button
            onClick={loadSales}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShoppingBag size={18} />
              Transactions
            </div>
            <p className="mt-3 text-2xl font-bold">
              {loading ? "..." : filteredSales.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on current filters
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CircleDollarSign size={18} />
              Sales total
            </div>
            <p className="mt-3 text-2xl font-bold">
              {loading ? "..." : formatCurrency(totalSales)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on current filters
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sale ID or cashier..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All payment methods</option>
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          {error && (
            <div className="m-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading sales...
            </div>
          ) : error && sales.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Sales could not be loaded.
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No transactions found. Try changing your filters.
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
                  {filteredSales.map((sale) => (
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
        </section>
      </main>
    </div>
  );
}
