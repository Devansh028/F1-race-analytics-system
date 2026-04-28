import axios from "axios";

const TOKEN_KEY = "f1-token";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function startRace(payload = {}) {
  const { data } = await api.post("/races/start", payload);
  return data;
}

export async function getRaceStatus(raceId) {
  const { data } = await api.get(`/races/status/${raceId}`);
  return data;
}

export async function getLatestRace() {
  const { data } = await api.get("/races/latest");
  return data;
}

export async function getRecentRaces() {
  const { data } = await api.get("/races/recent");
  return data;
}

export async function getTrackPresets() {
  const { data } = await api.get("/races/tracks");
  return data;
}

export async function getRaceEvents(raceId) {
  const { data } = await api.get(`/races/events/${raceId}`);
  return data;
}

export async function getRaceReplay(raceId) {
  const { data } = await api.get(`/races/replay/${raceId}`);
  return data;
}

export async function getRaceMetrics(raceId) {
  const { data } = await api.get(`/races/metrics/${raceId}`);
  return data;
}

export default api;
