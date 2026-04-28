import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form);
      const to = location.state?.from?.pathname || "/live";
      navigate(to, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Sign In" subtitle="Access your race analytics workspace.">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-700">Email address</label>
          <input
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            placeholder="Enter your username"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-700">Password</label>
          <input
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            placeholder="Enter your password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between">
          <button
            disabled={submitting}
            className="rounded-md bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow hover:bg-red-500 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <Link to="/register" className="text-base text-zinc-700 underline">
            Register with F1
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
