import { useEffect, useMemo, useState } from "react";
import { getLatestRace, getTrackPresets, startRace } from "../lib/api";

export default function AdminPage() {
  const [latestRace, setLatestRace] = useState(null);
  const [starting, setStarting] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [trackId, setTrackId] = useState("monaco");
  const [laps, setLaps] = useState(78);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mapUrl, setMapUrl] = useState(null);

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

  useEffect(() => {
    if (!selectedTrack) {
      setMapUrl(null);
      return;
    }
    setMapUrl(selectedTrack.mapImageUrl || selectedTrack.localMapImageUrl || null);
  }, [selectedTrack]);

  function handleMapError() {
    if (selectedTrack?.localMapImageUrl && mapUrl !== selectedTrack.localMapImageUrl) {
      setMapUrl(selectedTrack.localMapImageUrl);
      return;
    }
    setMapUrl(null);
  }

  async function handleStartRace() {
    setStarting(true);
    setError("");
    setMessage("");
    try {
      const data = await startRace({ trackId, totalLaps: laps });
      setLatestRace(data.race);
      setMessage(`Race started successfully. Race ID: ${data.race?._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to start race.");
    } finally {
      setStarting(false);
    }
  }

  async function handleFetchLatest() {
    setLoadingLatest(true);
    setError("");
    setMessage("");
    try {
      const data = await getLatestRace();
      setLatestRace(data.race);
      setMessage(`Latest Race ID: ${data.race?._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load latest race.");
    } finally {
      setLoadingLatest(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-red-400">Admin Control</p>
        <h2 className="mt-2 text-2xl font-semibold">Race Management</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Start race simulations and copy race ids to share with viewer users.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Track
            </label>
            <select
              value={trackId}
              onChange={(e) => {
                const nextTrack = tracks.find((t) => t.id === e.target.value);
                setTrackId(e.target.value);
                if (nextTrack) setLaps(nextTrack.defaultLaps);
              }}
              className="w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-sm"
            >
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name} ({track.location})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Laps
            </label>
            <input
              type="number"
              min={5}
              max={120}
              value={laps}
              onChange={(e) => setLaps(Number(e.target.value))}
              className="w-full rounded-md border border-white/15 bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {mapUrl && (
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-900/40 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              {selectedTrack.circuit} • {selectedTrack.circuitLengthKm} km
            </p>
            <img
              src={mapUrl}
              alt={`${selectedTrack.name} circuit map`}
              className="mt-3 max-h-56 w-full rounded-lg object-contain bg-zinc-950"
              loading="lazy"
              onError={handleMapError}
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleStartRace}
            disabled={starting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-60"
          >
            {starting ? "Starting..." : "Start New Race"}
          </button>
          <button
            onClick={handleFetchLatest}
            disabled={loadingLatest}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-600 disabled:opacity-60"
          >
            {loadingLatest ? "Loading..." : "Fetch Latest Race"}
          </button>
        </div>
      </section>

      {(latestRace || message || error) && (
        <section className="glass rounded-2xl p-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {latestRace && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Race ID" value={latestRace._id} />
              <Metric label="Track" value={latestRace.track || "Monaco"} />
              <Metric label="Circuit" value={latestRace.circuit || "Circuit"} />
              <Metric label="Location" value={latestRace.location || "-"} />
              <Metric label="Laps" value={latestRace.totalLaps || "-"} />
              <Metric label="Status" value={latestRace.status || "ONGOING"} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-zinc-900/60 p-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
