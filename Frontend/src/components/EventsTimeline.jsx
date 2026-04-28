const typeColor = {
  OVERTAKE: "text-sky-300",
  PIT_STOP: "text-amber-300",
  DNF: "text-red-400",
  SAFETY_CAR_DEPLOYED: "text-yellow-300",
  SAFETY_CAR_END: "text-lime-300",
  WEATHER_CHANGE: "text-cyan-300",
  PHASE_CHANGE: "text-fuchsia-300",
  RACE_END: "text-emerald-300",
};

export default function EventsTimeline({ events }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-3 text-lg font-semibold">Event Timeline</h2>
      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {events.map((event, index) => (
          <article
            key={`${event._id || event.sequence}-${index}`}
            className="fade-in-up rounded-md border border-white/10 bg-zinc-900/60 p-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${typeColor[event.type] || "text-zinc-200"}`}>{event.type}</span>
              <span className="text-zinc-400">
                Lap {event.lapNumber} {event.racePhase ? `• ${event.racePhase}` : ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-200">{event.description}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {event.weather ? `Weather: ${event.weather} • ` : ""}
              {event.createdAt ? new Date(event.createdAt).toLocaleTimeString() : "live"}
            </p>
          </article>
        ))}
        {!events.length && <p className="text-sm text-zinc-400">No events yet.</p>}
      </div>
    </section>
  );
}
