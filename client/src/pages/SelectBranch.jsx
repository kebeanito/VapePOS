import { useEffect, useState } from "react";
import { Building2, Loader2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function SelectBranch() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAssignment();
  }, []);

  const checkAssignment = async () => {
    try {
      const assignmentResponse = await api.get("/assignments/today");

      if (assignmentResponse.data?.assigned) {
        navigate("/cashier", { replace: true });
        return;
      }

      await loadBranches();
    } catch (error) {
      console.error("Assignment check failed:", error);

      if (error.response?.status === 403) {
        setError(
          error.response?.data?.message ||
            "You are not authorized to access branch assignment."
        );
      } else {
        await loadBranches();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await api.get("/branches");
      setBranches(response.data);
    } catch (error) {
      console.error("Failed to load branches:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load branches. Please try again."
      );
    }
  };

  const handleSelectBranch = async (branchId) => {
    setError("");
    setSelecting(true);

    try {
      await api.post("/assignments", {
        branchId: branchId,
      });

      navigate("/cashier", { replace: true });
    } catch (error) {
      console.error("Branch assignment failed:", error);

      setError(
        error.response?.data?.message ||
          "Unable to assign this branch. Please try again."
      );
    } finally {
      setSelecting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={24} />
          <span>Checking today's assignment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Welcome, {user?.fullName}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Select Your Branch
            </h1>

            <p className="mt-2 text-slate-500">
              Select the branch you are working at today.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSelectBranch(branch.id)}
              disabled={selecting}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Building2 size={24} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    {branch.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Work at this branch today
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selecting && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={18} />
            Assigning your branch...
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectBranch;