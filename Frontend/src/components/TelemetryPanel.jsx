import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function TelemetryPanel({ telemetry }) {
  const chartData = [...telemetry]
    .slice(0, 30)
    .reverse()
    .map((item) => ({
      lap: item.lap,
      speed: item.speed,
      fuel: item.fuelLevel,
      wear: item.tireWear,
    }));
  const latest = chartData[chartData.length - 1];

  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">Telemetry Feed</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">Last 30 samples</span>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Metric label="Speed" value={latest ? `${latest.speed ?? "-"} km/h` : "-"} tone="text-red-300" />
        <Metric label="Fuel" value={latest ? `${latest.fuel ?? "-"}%` : "-"} tone="text-emerald-300" />
        <Metric label="Tire Wear" value={latest ? `${latest.wear ?? "-"}%` : "-"} tone="text-amber-300" />
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="lap" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
            <Line type="monotone" dataKey="speed" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="fuel" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="wear" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className={`mt-1 text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
