import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function POS() {
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [processingSale, setProcessingSale] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [saleSuccess, setSaleSuccess] = useState(null);

  useEffect(() => {
    loadPOS();
  }, []);

  const loadPOS = async () => {
    try {
      setLoading(true);
      setError("");

      const assignmentResponse = await api.get("/assignments/today");

      if (!assignmentResponse.data?.assigned) {
        setError("You have not been assigned to a branch today.");
        return;
      }

      const currentAssignment = assignmentResponse.data;
      setAssignment(currentAssignment);

      const branchId = currentAssignment.branchId;

      const productsResponse = await api.get(
        "/products/branch/" + branchId + "/active"
      );

      setProducts(productsResponse.data);
    } catch (err) {
      console.error("Failed to load POS:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load POS products."
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const categoryNames = products
      .map((product) => product.category?.name)
      .filter(Boolean);

    return ["All", ...new Set(categoryNames)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return products.filter((product) => {
      const productName = product.name?.toLowerCase() || "";
      const productSku = product.sku?.toLowerCase() || "";
      const productCategory = product.category?.name || "";

      const matchesSearch =
        productName.includes(searchValue) ||
        productSku.includes(searchValue);

      const matchesCategory =
        selectedCategory === "All" ||
        productCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) => {
          if (item.id === product.id) {
            return {
              ...item,
              quantity: item.quantity + 1,
            };
          }

          return item;
        });
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }

        return item;
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (item.id === productId) {
            return {
              ...item,
              quantity: item.quantity - 1,
            };
          }

          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((total, item) => {
    return total + Number(item.price) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  const openCheckout = () => {
  if (cart.length === 0) {
    return;
  }

  setCheckoutError("");
  setSaleSuccess(null);
  setCashReceived("");
  setPaymentMethod("CASH");
  setCheckoutOpen(true);
};

const closeCheckout = () => {
  if (processingSale) {
    return;
  }

  setCheckoutOpen(false);
  setCheckoutError("");
};

const change =
  paymentMethod === "CASH" && cashReceived
    ? Number(cashReceived) - subtotal
    : 0;

const completeSale = async () => {
  if (cart.length === 0) {
    return;
  }

  if (!paymentMethod) {
    setCheckoutError("Please select a payment method.");
    return;
  }

  if (
    paymentMethod === "CASH" &&
    Number(cashReceived) < subtotal
  ) {
    setCheckoutError(
      "Cash received must be greater than or equal to the total."
    );
    return;
  }

  try {
    setProcessingSale(true);
    setCheckoutError("");

    const saleItems = cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    const response = await api.post("/sales", {
      items: saleItems,
      paymentMethod: paymentMethod,
    });

    setSaleSuccess(response.data);

    setCart([]);
    setCheckoutOpen(false);
  } catch (error) {
    console.error("Failed to complete sale:", error);

    setCheckoutError(
      error.response?.data?.message ||
        error.response?.data ||
        "Failed to complete sale."
    );
  } finally {
    setProcessingSale(false);
  }
};

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />

          <p className="text-sm text-slate-500">
            Loading POS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate("/cashier")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Point of Sale
              </p>

              <h1 className="text-lg font-bold text-slate-900">
                New Transaction
              </h1>
            </div>

          </div>

          {assignment && (
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">
                Current Branch
              </p>

              <p className="text-sm font-semibold text-slate-900">
                {assignment.branchName}
              </p>
            </div>
          )}

        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

            <p className="text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate("/cashier")}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-red-100"
            >
              Back
            </button>

          </div>
        </div>
      )}

      {!error && (
        <main className="mx-auto max-w-7xl p-4 sm:p-6">

          {/* Mobile branch */}
          {assignment && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:hidden">

              <p className="text-xs text-slate-400">
                Current Branch
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {assignment.branchName}
              </p>

            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* Products */}
            <section>

              {/* Search */}
              <div className="relative">

                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search product name or SKU..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />

              </div>

              {/* Categories */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">

                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={
                      selectedCategory === category
                        ? "whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        : "whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    }
                  >
                    {category}
                  </button>
                ))}

              </div>

              {/* Product heading */}
              <div className="mb-4 mt-4">

                <h2 className="font-semibold text-slate-900">
                  Products
                </h2>

                <p className="text-xs text-slate-400">
                  {filteredProducts.length} product
                  {filteredProducts.length !== 1 ? "s" : ""} available
                </p>

              </div>

              {/* Products */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                    <Package
                      size={26}
                      className="text-slate-400"
                    />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-700">
                    No products found
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Try another search or category.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >

                      <div className="flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Package size={22} />
                        </div>

                        {product.category?.name && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                            {product.category.name}
                          </span>
                        )}

                      </div>

                      <div className="mt-4 min-h-[76px]">

                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          SKU: {product.sku}
                        </p>

                      </div>

                      <p className="mt-3 text-lg font-bold text-slate-900">
                        ₱{Number(product.price).toFixed(2)}
                      </p>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                      >
                        <Plus size={17} />
                        Add to Cart
                      </button>

                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* Cart */}
            <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">

              <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Cart header */}
                <div className="flex items-center justify-between border-b border-slate-200 p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <ShoppingCart size={19} />
                    </div>

                    <div>

                      <h2 className="font-semibold text-slate-900">
                        Current Order
                      </h2>

                      <p className="text-xs text-slate-400">
                        {totalItems} item
                        {totalItems !== 1 ? "s" : ""}
                      </p>

                    </div>

                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs font-medium text-red-500 transition hover:text-red-600"
                    >
                      Clear
                    </button>
                  )}

                </div>

                {/* Cart contents */}
                <div className="flex-1 overflow-y-auto p-4">

                  {cart.length === 0 ? (
                    <div className="flex min-h-[280px] h-full flex-col items-center justify-center text-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <ShoppingCart
                          size={28}
                          className="text-slate-400"
                        />
                      </div>

                      <h3 className="mt-4 font-semibold text-slate-700">
                        Your cart is empty
                      </h3>

                      <p className="mt-1 max-w-[220px] text-sm text-slate-400">
                        Add products from the catalog to start a transaction.
                      </p>

                    </div>
                  ) : (
                    <div className="space-y-3">

                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 p-3"
                        >

                          {/* Item information */}
                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <h3 className="truncate text-sm font-semibold text-slate-800">
                                {item.name}
                              </h3>

                              <p className="mt-1 text-xs text-slate-400">
                                ₱{Number(item.price).toFixed(2)} each
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                              title="Remove item"
                            >
                              <X size={15} />
                            </button>

                          </div>

                          {/* Quantity */}
                          <div className="mt-3 flex items-center justify-between">

                            <div className="flex items-center rounded-lg border border-slate-200">

                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(item.id)
                                }
                                className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                              >
                                <Minus size={14} />
                              </button>

                              <span className="w-8 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(item.id)
                                }
                                className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                              >
                                <Plus size={14} />
                              </button>

                            </div>

                            <p className="text-sm font-bold text-slate-900">
                              ₱
                              {(
                                Number(item.price) *
                                item.quantity
                              ).toFixed(2)}
                            </p>

                          </div>

                        </div>
                      ))}

                    </div>
                  )}

                </div>

                {/* Cart summary */}
                <div className="border-t border-slate-200 bg-slate-50 p-5">

                  <div className="space-y-2">

                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>
                        ₱{subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Discount</span>
                      <span>₱0.00</span>
                    </div>

                    <div className="my-3 border-t border-slate-200" />

                    <div className="flex items-center justify-between">

                      <span className="font-semibold text-slate-900">
                        Total
                      </span>

                      <span className="text-2xl font-bold text-slate-900">
                        ₱{subtotal.toFixed(2)}
                      </span>

                    </div>

                  </div>

                  <button
                  type="button"
                  onClick={openCheckout}
                  disabled={cart.length === 0}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                <ShoppingCart size={18} />
                  Proceed to Checkout
            </button>

                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Checkout will be connected to the sales system next.
                  </p>

                </div>

              </div>

            </aside>

          </div>

          {checkoutOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Checkout
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Complete the current transaction
          </p>
        </div>

        <button
          type="button"
          onClick={closeCheckout}
          disabled={processingSale}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">

        {/* Total */}
        <div className="rounded-xl bg-slate-100 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Total Amount
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            ₱{subtotal.toFixed(2)}
          </p>
        </div>

        {/* Payment method */}
        <div className="mt-5">
          <label className="text-sm font-semibold text-slate-700">
            Payment Method
          </label>

          <div className="mt-2 grid grid-cols-3 gap-2">

            {["CASH", "GCASH", "CARD"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setPaymentMethod(method);
                  setCheckoutError("");
                }}
                className={
                  paymentMethod === method
                    ? "rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white"
                    : "rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                }
              >
                {method}
              </button>
            ))}

          </div>
        </div>

        {/* Cash */}
        {paymentMethod === "CASH" && (
          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-700">
              Cash Received
            </label>

            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                ₱
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(event) => {
                  setCashReceived(event.target.value);
                  setCheckoutError("");
                }}
                placeholder="0.00"
                className="h-12 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="mt-3 flex justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">
                Change
              </span>

              <span
                className={
                  change >= 0
                    ? "text-sm font-bold text-slate-900"
                    : "text-sm font-bold text-red-500"
                }
              >
                ₱{Math.max(change, 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {checkoutError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              {checkoutError}
            </p>
          </div>
        )}

        {/* Confirm */}
        <button
          type="button"
          onClick={completeSale}
          disabled={processingSale}
          className="mt-5 flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {processingSale
            ? "Processing Sale..."
            : "Complete Sale"}
        </button>

      </div>
    </div>
  </div>
)}

        </main>
      )}

    </div>
  );
}