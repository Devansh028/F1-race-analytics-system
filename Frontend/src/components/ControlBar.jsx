import { useEffect, useMemo, useState } from "react";
import { getTrackPresets, startRace } from "../lib/api";
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

export default function ControlBar({
  raceId,
  setRaceId,
  onRefresh,
  canStartRace,
  onUseLatest,
  recentRaces = [],
}) {
  const [input, setInput] = useState(raceId || "");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [tracks, setTracks] = useState([]);
  const [trackId, setTrackId] = useState("monaco");
  const [laps, setLaps] = useState(78);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === trackId),
    [tracks, trackId]
  );

  useEffect(() => {
    async function loadTracks() {
      try {
        const data = await getTrackPresets();
        const trackList = data?.tracks || [];
        setTracks(trackList);
        if (trackList.length > 0) {
          setTrackId(trackList[0].id);
          setLaps(trackList[0].defaultLaps);
        }
      } catch {
        setTracks([]);
      }
    }
    loadTracks();
  }, []);

  function formatRecentRaceLabel(race) {
    const statusLabel = race.status === "ONGOING" ? "LIVE" : race.status;
    const lapInfo =
      typeof race.currentLap === "number" && typeof race.totalLaps === "number"
        ? `L${race.currentLap}/${race.totalLaps}`
        : "Laps N/A";
    const location = race.location ? ` - ${race.location.split(",")[0]}` : "";
    return `${statusLabel} - ${race.track || "Track"}${location} - ${lapInfo}`;
  }

  async function onStartRace() {
    setStarting(true);
    setError("");
    try {
      const data = await startRace({ trackId, totalLaps: laps });
      const newRaceId = data?.race?._id;
      if (newRaceId) {
        setRaceId(newRaceId);
        setInput(newRaceId);
        onRefresh(newRaceId);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to start race");
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Race Control</p>
          {canStartRace && tracks.length > 0 && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-200">Track</label>
                <select
                  value={trackId}
                  onChange={(e) => {
                    const nextTrack = tracks.find((t) => t.id === e.target.value);
                    setTrackId(e.target.value);
                    if (nextTrack) setLaps(nextTrack.defaultLaps);
                  }}
                  className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm outline-none ring-red-500 transition focus:ring"
                >
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-200">Laps</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={laps}
                  onChange={(e) => setLaps(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm outline-none ring-red-500 transition focus:ring"
                />
              </div>
            </div>
          )}
          {canStartRace && selectedTrack && (
            <p className="mt-2 text-xs text-zinc-400">
              {selectedTrack.circuit} • {selectedTrack.location}
            </p>
          )}
          {recentRaces.length > 0 && (
            <>
              <label className="mt-2 block text-sm text-zinc-200">Recent races</label>
              <select
                className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm outline-none ring-red-500 transition focus:ring"
                value=""
                onChange={(e) => {
                  const selected = e.target.value;
                  if (!selected) return;
                  setInput(selected);
                  setError("");
                  setRaceId(selected);
                  onRefresh(selected);
                }}
              >
                <option value="" disabled>
                  Select recent race to connect
                </option>
                {recentRaces.map((r) => (
                  <option key={r._id} value={r._id}>
                    {formatRecentRaceLabel(r)}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="mt-2 block text-sm text-zinc-200">Race ID</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm outline-none ring-red-500 transition focus:ring"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter race id to connect live"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:min-w-[240px] xl:grid-cols-1">
          <button
            onClick={() => {
              const candidate = input.trim();
              if (!OBJECT_ID_REGEX.test(candidate)) {
                setError("Invalid Race ID. Please enter a valid 24-character race id.");
                return;
              }
              setError("");
              setRaceId(candidate);
              onRefresh(candidate);
            }}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium transition hover:bg-zinc-600"
          >
            Connect
          </button>
          <button
            onClick={onUseLatest}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium transition hover:bg-zinc-600"
          >
            Use Latest
          </button>
          {canStartRace && (
            <button
              onClick={onStartRace}
              disabled={starting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              aria-busy={starting}
            >
              {starting ? "Starting..." : "Start New Race"}
            </button>
          )}
          {!canStartRace && (
            <button
              disabled
              title="Only admin users can start races"
              className="cursor-not-allowed rounded-lg bg-zinc-700/60 px-4 py-2 text-sm font-semibold text-zinc-400"
            >
              Start New Race
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {!canStartRace && (
        <p className="mt-2 text-xs text-zinc-400">
          Only ADMIN users can start new races. You can still watch live data.
        </p>
      )}
    </section>
  );
}
