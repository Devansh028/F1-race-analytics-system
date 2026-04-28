import { useEffect, useState } from "react";
import ControlBar from "../components/ControlBar";
import RaceStatusCards from "../components/RaceStatusCards";
import LeaderboardTable from "../components/LeaderboardTable";
import TelemetryPanel from "../components/TelemetryPanel";
import EventsTimeline from "../components/EventsTimeline";
import useRaceRealtime from "../hooks/useRaceRealtime";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const {
    raceId,
    setRaceId,
    race,
    leaderboard,
    events,
    telemetry,
    latestTelemetryByDriver,
    connected,
    loading,
    error,
    refetchStatus,
    discoverLatestRace,
    recentRaces,
    fetchRecentRaces,
  } = useRaceRealtime();
  const [mapUrl, setMapUrl] = useState(null);

  useEffect(() => {
    fetchRecentRaces();
    if (raceId) {
      refetchStatus(raceId);
      return;
    }
    discoverLatestRace();
  }, []);

  useEffect(() => {
    if (!race) {
      setMapUrl(null);
      return;
    }
    setMapUrl(race.mapImageUrl || race.localMapImageUrl || null);
  }, [race]);

  function handleMapError() {
    if (race?.localMapImageUrl && mapUrl !== race.localMapImageUrl) {
      setMapUrl(race.localMapImageUrl);
      return;
    }
    setMapUrl(null);
  }

  return (
    <div className="space-y-5">
      <ControlBar
        raceId={raceId}
        setRaceId={setRaceId}
        onRefresh={refetchStatus}
        canStartRace={isAdmin}
        onUseLatest={discoverLatestRace}
        recentRaces={recentRaces}
      />

      {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-zinc-400">Loading race data...</p>}
      {loading && !race && (
        <section className="glass grid gap-4 rounded-2xl p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
          <div className="skeleton h-44 w-full rounded-xl" />
        </section>
      )}

      {race && (
        <section className="glass grid gap-4 rounded-2xl p-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Selected Event</p>
            <h2 className="mt-2 text-3xl font-bold text-zinc-50">{race.track}</h2>
            <p className="mt-3 text-sm text-zinc-300">
              {race.circuit || "Circuit"} {race.location ? `• ${race.location}` : ""}
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Phase: <span className="text-zinc-100">{race.phase}</span> • Weather:{" "}
              <span className="text-zinc-100">{race.weather}</span>
            </p>
          </div>
          {mapUrl ? (
            <img
              src={mapUrl}
              alt={`${race.track} map`}
              className="max-h-44 w-full rounded-xl border border-white/10 bg-zinc-950/80 object-contain p-2"
              loading="lazy"
              onError={handleMapError}
            />
          ) : null}
        </section>
      )}

      <RaceStatusCards race={race} connected={connected} leaderboard={leaderboard} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <LeaderboardTable leaderboard={leaderboard} telemetryByDriver={latestTelemetryByDriver} />
        </div>
        <EventsTimeline events={events} />
      </div>

      <TelemetryPanel telemetry={telemetry} />
    </div>
  );
}
