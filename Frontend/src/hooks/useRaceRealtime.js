import { useEffect, useMemo, useState } from "react";
import socket from "../lib/socket";
import { getLatestRace, getRaceEvents, getRaceStatus, getRecentRaces } from "../lib/api";

const STORAGE_KEY = "f1-last-race-id";
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

export default function useRaceRealtime() {
  const [raceId, setRaceId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [race, setRace] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [events, setEvents] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentRaces, setRecentRaces] = useState([]);

  useEffect(() => {
    if (raceId && !OBJECT_ID_REGEX.test(raceId)) {
      localStorage.removeItem(STORAGE_KEY);
      setRaceId("");
      setError("Stored race id was invalid and has been cleared.");
      return;
    }
    if (!raceId) return;
    localStorage.setItem(STORAGE_KEY, raceId);
  }, [raceId]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!raceId) return;
    socket.emit("joinRace", raceId);

    const onLeaderboard = (payload) => setLeaderboard(payload || []);
    const onEvents = (payload) =>
      setEvents((prev) => [...(payload || []), ...prev].slice(0, 120));
    const onTelemetry = (payload) =>
      setTelemetry((prev) => [...(payload || []), ...prev].slice(0, 300));
    const onFinished = () => {
      refetchStatus();
    };
    const onRaceControl = (payload) => {
      setRace((prev) =>
        prev
          ? {
              ...prev,
              currentLap: payload?.currentLap ?? prev.currentLap,
              phase: payload?.phase ?? prev.phase,
              weather: payload?.weather ?? prev.weather,
              safetyCarActive: payload?.safetyCarActive ?? prev.safetyCarActive,
            }
          : prev
      );
    };

    socket.on("leaderboardUpdate", onLeaderboard);
    socket.on("raceEvents", onEvents);
    socket.on("telemetryUpdate", onTelemetry);
    socket.on("raceFinished", onFinished);
    socket.on("raceControlUpdate", onRaceControl);

    return () => {
      socket.emit("leaveRace", raceId);
      socket.off("leaderboardUpdate", onLeaderboard);
      socket.off("raceEvents", onEvents);
      socket.off("telemetryUpdate", onTelemetry);
      socket.off("raceFinished", onFinished);
      socket.off("raceControlUpdate", onRaceControl);
    };
  }, [raceId]);

  useEffect(() => {
    if (!raceId) return;
    const interval = setInterval(() => {
      refetchStatus(raceId);
    }, 10000);
    return () => clearInterval(interval);
  }, [raceId]);

  async function refetchStatus(id = raceId) {
    if (!id) return;
    if (!OBJECT_ID_REGEX.test(id)) {
      setError("Invalid Race ID format. Use a valid 24-character race id.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [status, raceEvents] = await Promise.all([getRaceStatus(id), getRaceEvents(id)]);
      setRace(status.race);
      setLeaderboard(status.leaderboard || []);
      setEvents(raceEvents || []);
      setRaceId(id);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load race data.");
    } finally {
      setLoading(false);
    }
  }

  async function discoverLatestRace() {
    setError("");
    try {
      const data = await getLatestRace();
      if (data?.race?._id) {
        await refetchStatus(data.race._id);
      }
    } catch (err) {
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.message || "Could not discover latest race.");
      }
    }
  }

  async function fetchRecentRaces() {
    try {
      const data = await getRecentRaces();
      setRecentRaces(data?.races || []);
    } catch {
      setRecentRaces([]);
    }
  }

  const latestTelemetryByDriver = useMemo(() => {
    const map = new Map();
    for (const item of telemetry) {
      if (!map.has(item.driverId)) map.set(item.driverId, item);
    }
    return map;
  }, [telemetry]);

  return {
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
  };
}
