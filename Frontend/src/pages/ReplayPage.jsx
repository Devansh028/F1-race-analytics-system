import { useState } from "react";
import { getRaceReplay } from "../lib/api";

export default function ReplayPage() {
  const [raceId, setRaceId] = useState(localStorage.getItem("f1-last-race-id") || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadReplay() {
    if (!raceId) return;
    setLoading(true);
    setError("");
    try {
      const replay = await getRaceReplay(raceId);
      setData(replay);
    } catch (err) {
      setError(err?.response?.data?.message || "Replay could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Race Replay</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Rebuild race history with timeline, laps, and telemetry snapshots.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm"
            value={raceId}
            onChange={(e) => setRaceId(e.target.value)}
            placeholder="Enter race id"
          />
          <button onClick={loadReplay} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500">
            Load
          </button>
        </div>
      </section>

      {loading && <p className="text-sm text-zinc-400">Loading replay...</p>}
      {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {data && (
        <section className="glass rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Track" value={data.race?.track || "Unknown"} />
            <Metric label="Laps" value={`${data.race?.currentLap}/${data.race?.totalLaps}`} />
            <Metric label="Events" value={data.timeline?.length || 0} />
            <Metric label="Telemetry Rows" value={data.telemetry?.length || 0} />
          </div>
          <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-900/80 text-xs uppercase tracking-[0.2em] text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Lap</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {(data.timeline || []).map((event) => (
                  <tr key={event._id} className="border-t border-white/8">
                    <td className="px-2 py-2">{event.lapNumber}</td>
                    <td className="px-2 py-2">{event.type}</td>
                    <td className="px-2 py-2">{event.description}</td>
                    <td className="px-2 py-2">{new Date(event.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-zinc-900/50 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
