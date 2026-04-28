export default function RaceStatusCards({ race, connected, leaderboard }) {
  const leader = [...(leaderboard || [])]
    .filter((driver) => driver.status !== "DNF")
    .sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER))[0];

  const cards = [
    { label: "Socket", value: connected ? "Connected" : "Offline", tone: connected ? "text-emerald-400" : "text-amber-400" },
    { label: "Phase", value: race?.phase || "N/A" },
    { label: "Weather", value: race?.weather || "N/A" },
    { label: "Safety Car", value: race?.safetyCarActive ? "DEPLOYED" : "Clear" },
    { label: "Lap", value: race ? `${race.currentLap}/${race.totalLaps}` : "N/A" },
    { label: "Leader", value: leader?.name || "N/A" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <article
          key={card.label}
          className="glass fade-in-up rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-white/15"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{card.label}</p>
          <p className={`mt-2 text-xl font-semibold ${card.tone || "text-zinc-100"}`}>{card.value}</p>
        </article>
      ))}
    </section>
  );
}
