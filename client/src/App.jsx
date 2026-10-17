import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CashierDashboard from "./pages/CashierDashboard";
import SelectBranch from "./pages/SelectBranch";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import SalesHistory from "./pages/SalesHistory";
import AdminSales from "./pages/AdminSales";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleRoute({ role, children }) {
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute role="ADMIN">
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Cashier branch selection */}
        <Route
          path="/cashier/select-branch"
          element={
            <ProtectedRoute>
              <RoleRoute role="CASHIER">
                <SelectBranch />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
         path="/cashier/pos"
         element={
         <RoleRoute role="CASHIER">
         <POS />
         </RoleRoute>
      }
/>

        {/* Cashier dashboard */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute>
              <RoleRoute role="CASHIER">
                <CashierDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier/inventory"
            element={
              <ProtectedRoute>
                <RoleRoute role="CASHIER">
                  <Inventory />
              </RoleRoute>
        </ProtectedRoute>
        }
      />

   <Route
      path="/cashier/sales"
      element={
      <ProtectedRoute>
      <RoleRoute role="CASHIER">
        <SalesHistory />
      </RoleRoute>
    </ProtectedRoute>
    }
    />

    <Route
  path="/admin/sales"
  element={
    <ProtectedRoute>
      <RoleRoute role="ADMIN">
        <AdminSales />
      </RoleRoute>
    </ProtectedRoute>
  }
/>

        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Unknown page */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;