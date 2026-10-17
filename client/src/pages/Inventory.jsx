
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  History,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value ?? 0));
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    (typeof error.response?.data === "string"
      ? error.response.data
      : null) ||
    "Something went wrong. Please try again."
  );
}

function Inventory() {
  const navigate = useNavigate();

const [showProductModal, setShowProductModal] = useState(false);
const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    categoryId: "",
    });

const [categories, setCategories] = useState([]);

  const [assignment, setAssignment] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("STOCK_IN");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const branchId =
    assignment?.branchId ??
    assignment?.branch?.id ??
    assignment?.branch?.branchId;

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const assignmentResponse = await api.get("/assignments/today");
      const currentAssignment = assignmentResponse.data;

      if (!currentAssignment?.assigned) {
        navigate("/cashier/select-branch", { replace: true });
        return;
      }

      const currentBranchId =
        currentAssignment.branchId ??
        currentAssignment.branch?.id ??
        currentAssignment.branch?.branchId;

      if (currentBranchId == null) {
        throw new Error(
          "The branch ID was not included in your assignment response."
        );
      }

      setAssignment(currentAssignment);

      const [productResponse, inventoryResponse, transactionResponse] =
        await Promise.all([
          api.get(`/products/branch/${currentBranchId}`),
          api.get(`/inventory/branch/${currentBranchId}`),
          api
            .get(`/inventory/transactions/branch/${currentBranchId}`)
            .catch(() => ({ data: [] })),
        ]);

      setProducts(
        Array.isArray(productResponse.data) ? productResponse.data : []
      );
      setInventory(
        Array.isArray(inventoryResponse.data) ? inventoryResponse.data : []
      );
      setTransactions(
        Array.isArray(transactionResponse.data)
          ? transactionResponse.data.slice(0, 8)
          : []
      );
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError(
        err.message ||
          getErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  loadCategories();
}, []);

  const rows = useMemo(() => {
    return products.map((product) => {
      const record = inventory.find(
        (item) =>
          String(item.product?.id ?? item.productId) ===
          String(product.id)
      );

      const stock = Number(record?.quantity ?? 0);
      const reorderLevel = Number(record?.reorderLevel ?? 10);

      return {
        ...product,
        stock,
        reorderLevel,
        inventoryId: record?.id ?? null,
        categoryName:
          product.category?.name ??
          product.categoryName ??
          "Uncategorized",
        isActive: product.active ?? product.isActive ?? true,
      };
    });
  }, [products, inventory]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((product) => {
      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.categoryName.toLowerCase().includes(term);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "LOW" &&
          product.isActive &&
          product.stock > 0 &&
          product.stock <= product.reorderLevel) ||
        (filter === "OUT" && product.isActive && product.stock === 0) ||
        (filter === "INACTIVE" && !product.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const activeRows = rows.filter((product) => product.isActive);
  const lowStockCount = activeRows.filter(
    (product) =>
      product.stock > 0 && product.stock <= product.reorderLevel
  ).length;
  const outOfStockCount = activeRows.filter(
    (product) => product.stock === 0
  ).length;


  const handleAddProduct = async (event) => {
  event.preventDefault();

  if (branchId == null) {
    setError("Your assigned branch could not be identified.");
    return;
  }

  if (
    !productForm.name.trim() ||
    !productForm.sku.trim() ||
    !productForm.categoryId ||
    !productForm.price ||
    Number(productForm.price) <= 0
  ) {
    setError("Please complete all fields with valid values.");
    return;
  }

  try {
    setSaving(true);
    setError("");

    await api.post("/products", {
      branchId: Number(branchId),
      name: productForm.name.trim(),
      sku: productForm.sku.trim(),
      price: Number(productForm.price),
      categoryId: Number(productForm.categoryId),
    });

    setShowProductModal(false);
    setProductForm({
      name: "",
      sku: "",
      price: "",
      categoryId: "",
    });

    await loadInventory();
    setNotice("Product added successfully!");
  } catch (err) {
    console.error("Failed to add product:", err);
    setError(getErrorMessage(err));
  } finally {
    setSaving(false);
  }
};
  const openStockModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setQuantity("");
    setReason("");
    setFormError("");
    setNotice("");
    setModalOpen(true);
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Enter a whole number greater than zero.");
      return;
    }

    if (!reason.trim()) {
      setFormError("Please enter a reason for this stock change.");
      return;
    }

    if (branchId == null || !selectedProduct) {
      setFormError("Branch or product information is missing.");
      return;
    }

    setSaving(true);

    try {
      if (modalType === "STOCK_IN") {
        await api.post("/inventory/stock-in", {
          branchId: Number(branchId),
          productId: Number(selectedProduct.id),
          quantity: parsedQuantity,
          reason: reason.trim(),
        });
      } else {
        // Adjustment quantity is the amount to add or subtract.
        const adjustment = modalType === "ADD" 
          ? parsedQuantity
          : -parsedQuantity;

        await api.post("/inventory/adjustment", {
          branchId: Number(branchId),
          productId: Number(selectedProduct.id),
          quantity: adjustment,
          reason: reason.trim(),
        });
      }

      setModalOpen(false);
      setNotice(
        modalType === "STOCK_IN"
          ? "Stock added successfully."
          : "Inventory quantity adjusted successfully."
      );

      await loadInventory();
    } catch (err) {
      console.error("Failed to update stock:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

    
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <LoaderCircle className="mr-3 animate-spin" size={22} />
        <span className="text-sm text-slate-600">
          Loading inventory...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cashier")}
              className="rounded-lg p-2 transition hover:bg-slate-100"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Boxes size={19} />
            </div>

            <div>
  <h1 className="font-bold">Inventory</h1>
  <p className="text-xs text-slate-500">
    {assignment?.branchName ??
      assignment?.branch?.name ??
      "Assigned Branch"}
  </p>
</div>
          </div>

          <button
            onClick={loadInventory}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      
<main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold">Branch Stock</h2>
      <p className="mt-1 text-sm text-slate-500">
        View products and manage stock for your assigned branch.
      </p>
    </div>

    <button
      onClick={() => {
        setProductForm({
          name: "",
          sku: "",
          price: "",
          categoryId: "",
        });
        setError("");
        setShowProductModal(true);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700"
    >
      <Plus size={18} />
      Add Product
    </button>
  </div>


        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button
              onClick={loadInventory}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Products"
            value={activeRows.length}
            icon={<Package size={21} />}
          />
          <SummaryCard
            label="Low Stock"
            value={lowStockCount}
            icon={<Boxes size={21} />}
          />
          <SummaryCard
            label="Out of Stock"
            value={outOfStockCount}
            icon={<Package size={21} />}
          />
          <SummaryCard
            label="Stock Records"
            value={inventory.length}
            icon={<History size={21} />}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
            <div>
              <h3 className="font-semibold">Products and Stock</h3>
              <p className="mt-1 text-sm text-slate-500">
                Stock warnings use each product's reorder level.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, SKU, or category..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="ALL">All products</option>
                <option value="LOW">Low stock</option>
                <option value="OUT">Out of stock</option>
                <option value="INACTIVE">Inactive products</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((product) => {
                  const low =
                    product.isActive &&
                    product.stock > 0 &&
                    product.stock <= product.reorderLevel;
                  const out =
                    product.isActive && product.stock === 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium">
                        {product.name}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {product.sku || "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {product.categoryName}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            low || out
                              ? "font-semibold text-amber-700"
                              : "font-medium text-slate-800"
                          }
                        >
                          {product.stock}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">
                          / min {product.reorderLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          label={
                            !product.isActive
                              ? "Inactive"
                              : out
                                ? "Out of stock"
                                : low
                                  ? "Low stock"
                                  : "In stock"
                          }
                          tone={
                            !product.isActive
                              ? "gray"
                              : out || low
                                ? "amber"
                                : "green"
                          }
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {product.isActive && (
                            <>
                              <button
                                onClick={() =>
                                  openStockModal(product, "STOCK_IN")
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                              >
                                <Plus size={14} />
                                Stock in
                              </button>
                              <button
                                onClick={() =>
                                  openStockModal(product, "ADJUST")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                              >
                                Adjust
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      <Package
                        size={28}
                        className="mx-auto mb-3 text-slate-400"
                      />
                      <p className="font-medium">No products found</p>
                      <p className="mt-1 text-sm">
                        Try another search or filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            Showing {filteredRows.length} of {rows.length} products
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Recent Stock Activity</h3>
              <p className="text-sm text-slate-500">
                Latest inventory transactions for this branch.
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No stock activity to display yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Quantity</th>
                    <th className="px-5 py-3 font-medium">Reason</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id ?? index}>
                      <td className="px-5 py-4 font-medium">
                        {transaction.product?.name ?? "Product"}
                      </td>
                      <td className="px-5 py-4">
                        {transaction.type ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {transaction.quantity ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {transaction.reason || "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {transaction.createdAt
                          ? new Date(transaction.createdAt).toLocaleString(
                              "en-PH"
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {showProductModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <form
      onSubmit={handleAddProduct}
      className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Add New Product</h2>

        <button
          type="button"
          onClick={() => setShowProductModal(false)}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Product Name
        </label>
        <input
          required
          value={productForm.name}
          onChange={(e) =>
            setProductForm({ ...productForm, name: e.target.value })
          }
          placeholder="e.g. Mango E-Liquid"
          className="w-full rounded-lg border border-slate-300 p-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          SKU / Product Code
        </label>
        <input
          required
          value={productForm.sku}
          onChange={(e) =>
            setProductForm({ ...productForm, sku: e.target.value })
          }
          placeholder="e.g. ELQ-001"
          className="w-full rounded-lg border border-slate-300 p-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Price (₱)
        </label>
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          value={productForm.price}
          onChange={(e) =>
            setProductForm({ ...productForm, price: e.target.value })
          }
          placeholder="e.g. 250.00"
          className="w-full rounded-lg border border-slate-300 p-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Category
        </label>
        <select
          required
          value={productForm.categoryId}
          onChange={(e) =>
            setProductForm({ ...productForm, categoryId: e.target.value })
          }
          className="w-full rounded-lg border border-slate-300 bg-white p-3"
        >
          <option value="">Select a category</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-amber-700">
          No categories loaded. Check that your backend's
          GET /api/categories endpoint is working.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowProductModal(false)}
          disabled={saving}
          className="rounded-lg border border-slate-300 px-4 py-2.5"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  </div>
)}

      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-bold">
                  {modalType === "STOCK_IN"
                    ? "Add Stock"
                    : "Adjust Stock"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4 p-5">
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                Current quantity:{" "}
                <span className="font-bold">{selectedProduct.stock}</span>
              </div>

              {(modalType === "ADJUST" || modalType === "ADD") && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Adjustment type
                  </label>
                  <select
                    value={modalType}
                    onChange={(event) => setModalType(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="ADJUST">Subtract stock</option>
                    <option value="ADD">Add stock</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Enter quantity"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
                {(modalType === "ADJUST" || modalType === "ADD") && (
                  <p className="mt-1 text-xs text-slate-500">
                    The adjustment adds or subtracts the quantity you enter.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. New delivery or physical stock count"
                  rows={3}
                  required
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ label, tone }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone] ?? colors.gray}`}
    >
      {label}
    </span>
  );
}

export default Inventory;
