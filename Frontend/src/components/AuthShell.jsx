import { Link, useLocation } from "react-router-dom";

export default function AuthShell({ title, subtitle, children }) {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <div className="mx-auto mt-10 grid w-full max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/85 shadow-[0_25px_70px_rgba(0,0,0,0.55)] lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden border-r border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-12 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.25),transparent_55%)]" />
        <div className="relative">
          <p className="text-sm uppercase tracking-[0.45em] text-red-500">Formula 1</p>
          <h2 className="mt-6 text-5xl font-black uppercase leading-tight text-white">
            Race Intelligence Platform
          </h2>
          <p className="mt-6 max-w-md text-base text-zinc-300">
            Secure authentication gateway for race control, live telemetry, and analytics operations.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-300">
            <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2">Live race timing and telemetry</p>
            <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2">Replay and performance analytics</p>
            <p className="rounded-md border border-white/10 bg-white/5 px-3 py-2">Admin race control and seeding</p>
          </div>
        </div>
      </aside>

      <section className="overflow-hidden">
        <div className="border-b border-zinc-500/40 bg-zinc-900 px-8 py-5">
          <div className="mx-auto flex max-w-lg items-center gap-10 text-base font-semibold">
            <Link
              to="/login"
              className={`pb-2 transition ${isLogin ? "border-b-2 border-red-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`pb-2 transition ${!isLogin ? "border-b-2 border-red-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Register
            </Link>
          </div>
        </div>

        <div className="bg-zinc-100 px-8 py-12 text-zinc-900">
          <div className="mx-auto w-full max-w-lg space-y-7">
            <div>
              <h1 className="text-5xl font-black uppercase tracking-wide">{title}</h1>
              <p className="mt-3 text-base text-zinc-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
