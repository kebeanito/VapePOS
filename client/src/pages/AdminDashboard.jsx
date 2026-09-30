function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">
          VapePOS
        </h1>
      </header>

      <main className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Admin Dashboard
        </h2>

        <p className="mt-2 text-slate-600">
          Welcome, Administrator.
        </p>
      </main>
    </div>
  );
}

export default AdminDashboard;