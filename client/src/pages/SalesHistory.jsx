
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  RefreshCw,
  Search,
  ShoppingBag,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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

function SalesHistory() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/sales/my-branch");
      setSales(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load sales history. Please try again."
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

      const matchesPayment =
        paymentFilter === "ALL" ||
        sale.paymentMethod === paymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, search, paymentFilter]);

  const totalSales = filteredSales.reduce(
    (total, sale) => total + Number(sale.totalAmount ?? 0),
    0
  );

  async function openSale(saleId) {
    setDetailLoading(true);
    setSelectedSale(null);

    try {
      const response = await api.get(`/sales/${saleId}`);
      setSelectedSale(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load transaction details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
            <ShoppingBag size={21} />
          </div>
          <div>
            <h1 className="text-lg font-bold">VapePOS</h1>
            <p className="text-xs text-slate-500">Sales Management</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/cashier")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Sales History</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review transactions from your assigned branch.
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
              Transactions shown
            </div>
            <p className="mt-3 text-2xl font-bold">
              {loading ? "..." : filteredSales.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={18} />
              Sales total shown
            </div>
            <p className="mt-3 text-2xl font-bold">
              {loading ? "..." : formatCurrency(totalSales)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Based on the current filters
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sale ID or cashier..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            >
              <option value="ALL">All payment methods</option>
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          {error && (
            <div className="m-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading sales history...
            </div>
          ) : error && sales.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Sales history could not be loaded.
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag
                size={30}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 font-medium">No transactions found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or payment filter.
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
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 text-right font-medium">Details</th>
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
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {sale.cashier || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
                          {sale.paymentMethod || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <button
                          onClick={() => openSale(sale.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {(detailLoading || selectedSale) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {detailLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading transaction details...
              </p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      Transaction #{selectedSale.id}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(selectedSale.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                  <p>
                    Cashier:{" "}
                    <span className="font-semibold">
                      {selectedSale.cashier || "—"}
                    </span>
                  </p>
                  <p>
                    Branch:{" "}
                    <span className="font-semibold">
                      {selectedSale.branch || "—"}
                    </span>
                  </p>
                  <p>
                    Payment:{" "}
                    <span className="font-semibold">
                      {selectedSale.paymentMethod || "—"}
                    </span>
                  </p>
                </div>

                <h4 className="mt-5 font-semibold">Items</h4>

                <div className="mt-3 divide-y divide-slate-100">
                  {(selectedSale.items || []).map((item, index) => (
                    <div
                      key={item.id ?? index}
                      className="flex items-start justify-between gap-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Quantity: {item.quantity ?? "—"}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(
                          item.subtotal ??
                            Number(item.price ?? item.unitPrice ?? 0) *
                              Number(item.quantity ?? 0)
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between border-t border-slate-200 pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(selectedSale.totalAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesHistory;
