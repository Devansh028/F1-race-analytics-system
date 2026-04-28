import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    country: "",
    dob: "",
    email: "",
    password: "",
    role: "USER",
    adminCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim();
      const payload = {
        name: fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        adminCode: form.role === "ADMIN" ? form.adminCode : undefined,
      };
      await register(payload);
      navigate("/live", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create Account" subtitle="Join the paddock and run race analytics.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-700">First name</label>
          <input
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-700">Last name</label>
          <input
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
              <label className="mb-2 block text-base font-semibold text-zinc-700">Date of birth</label>
            <input
              type="date"
                className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
              value={form.dob}
              onChange={(e) => setForm((prev) => ({ ...prev, dob: e.target.value }))}
            />
          </div>
          <div>
              <label className="mb-2 block text-base font-semibold text-zinc-700">Country of residence</label>
            <input
                className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-700">Email address</label>
          <input
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            placeholder="Email address"
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
            placeholder="Password"
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-500">Account Type</label>
          <select
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {form.role === "ADMIN" && (
          <input
            className="w-full rounded-lg border border-zinc-400 bg-white px-5 py-3.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-red-500"
            placeholder="Admin invite code"
            value={form.adminCode}
            onChange={(e) => setForm((prev) => ({ ...prev, adminCode: e.target.value }))}
            required
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between">
          <Link to="/login" className="text-base text-zinc-700 underline">
            Already have an account?
          </Link>
          <button
            disabled={submitting}
            className="rounded-md bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow hover:bg-red-500 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Register"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
