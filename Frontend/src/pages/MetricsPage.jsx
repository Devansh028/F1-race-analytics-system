import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getRaceMetrics } from "../lib/api";

export default function MetricsPage() {
  const [raceId, setRaceId] = useState(localStorage.getItem("f1-last-race-id") || "");
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMetrics() {
    if (!raceId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getRaceMetrics(raceId);
      setDrivers(data.drivers || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Metrics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Performance Metrics</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Compare average pace, consistency, and best laps per driver.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm"
            value={raceId}
            onChange={(e) => setRaceId(e.target.value)}
            placeholder="Enter race id"
          />
          <button onClick={loadMetrics} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500">
            Analyze
          </button>
        </div>
      </section>

      {loading && <p className="text-sm text-zinc-400">Computing metrics...</p>}
      {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {!!drivers.length && (
        <>
          <section className="glass rounded-2xl p-5">
            <h3 className="mb-4 text-base font-semibold">Average Lap Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drivers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="driverId" stroke="#a1a1aa" hide />
                  <YAxis stroke="#a1a1aa" />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
                  <Bar dataKey="avgLapTime" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-900/70 text-xs uppercase tracking-[0.2em] text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Driver ID</th>
                  <th className="px-2 py-2">Laps</th>
                  <th className="px-2 py-2">Average</th>
                  <th className="px-2 py-2">Best Lap</th>
                  <th className="px-2 py-2">Consistency</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.driverId} className="border-t border-white/8 transition odd:bg-white/[0.01] hover:bg-white/[0.03]">
                    <td className="px-2 py-2">{driver.driverId}</td>
                    <td className="px-2 py-2">{driver.laps}</td>
                    <td className="px-2 py-2">{driver.avgLapTime}s</td>
                    <td className="px-2 py-2">{driver.bestLap}s</td>
                    <td className="px-2 py-2">{driver.consistency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
