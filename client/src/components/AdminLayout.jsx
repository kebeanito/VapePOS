
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Sales Management",
    path: "/admin/sales",
    icon: BarChart3,
  },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close the mobile sidebar whenever the page changes.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white">
            <ShoppingBag size={19} />
          </div>
          <div>
            <p className="font-bold text-slate-900">VapePOS</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Dark backdrop on mobile */}
        {isOpen && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:static lg:z-auto lg:min-h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Branding */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600">
                <ShoppingBag size={23} />
              </div>

              <div>
                <h1 className="text-xl font-bold">VapePOS</h1>
                <p className="mt-0.5 text-xs text-slate-400">
                  Admin Panel
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={21} />
            </button>
          </div>

          {/* Navigation */}
          <div className="px-4 py-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Main Menu
            </p>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-950/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={19} />
                    <span className="flex-1">{item.label}</span>

                    {location.pathname === item.path && (
                      <ChevronRight size={16} />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin information */}
          <div className="mt-auto border-t border-white/10 p-5">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-sm font-semibold">Administrator</p>
              <p className="mt-1 text-xs text-slate-400">
                VapePOS Management
              </p>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
