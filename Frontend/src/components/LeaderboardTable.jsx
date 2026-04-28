import { useMemo } from "react";

export default function LeaderboardTable({ leaderboard, telemetryByDriver }) {
  const topDriverId = useMemo(() => {
    const running = [...(leaderboard || [])]
      .filter((driver) => driver.status !== "DNF")
      .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
    return running[0]?.driverId;
  }, [leaderboard]);

  return (
    <section className="glass rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live Leaderboard</h2>
        <span className="text-xs uppercase tracking-[0.22em] text-zinc-400">Gap + Interval</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-900/70 text-xs uppercase tracking-[0.2em] text-zinc-400">
            <tr>
              <th className="px-2 py-2">Pos</th>
              <th className="px-2 py-2">Driver</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2">Gap</th>
              <th className="px-2 py-2">Interval</th>
              <th className="px-2 py-2">Tire</th>
              <th className="px-2 py-2">Wear</th>
              <th className="px-2 py-2">Speed</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((driver) => {
              const tel = telemetryByDriver.get(driver.driverId);
              return (
                <tr
                  key={driver.driverId}
                  className={`fade-in-soft border-t border-white/8 transition odd:bg-white/[0.01] hover:bg-white/[0.03] ${
                    driver.driverId === topDriverId ? "bg-emerald-500/10" : ""
                  }`}
                >
                  <td className="px-2 py-2 font-semibold text-red-300">P{driver.position}</td>
                  <td className="px-2 py-2 font-medium text-zinc-100">{driver.name}</td>
                  <td className={`px-2 py-2 ${driver.status === "DNF" ? "text-red-400" : "text-emerald-400"}`}>
                    {driver.status || "RUNNING"}
                  </td>
                  <td className="px-2 py-2">{driver.totalTime?.toFixed?.(2) ?? driver.totalTime}s</td>
                  <td className="px-2 py-2">{driver.gapToLeader ?? 0}s</td>
                  <td className="px-2 py-2">{driver.intervalToFront ?? 0}s</td>
                  <td className="px-2 py-2">{driver.tire || driver.tireType || "-"}</td>
                  <td className="px-2 py-2">{driver.tireWear ?? tel?.tireWear ?? "-"}%</td>
                  <td className="px-2 py-2">{tel?.speed ?? "-"} km/h</td>
                </tr>
              );
            })}
            {!leaderboard.length && (
              <tr>
                <td className="px-2 py-8 text-zinc-400" colSpan={9}>
                  No race stream yet. Start a race or connect with race id.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
