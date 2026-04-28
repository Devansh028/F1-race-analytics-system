const axios = require("axios");

const ERGAST_BASE_URL = "https://ergast.com/api/f1/current";

exports.fetchDrivers = async () => {
  const res = await axios.get(`${ERGAST_BASE_URL}/drivers.json`);
  return res.data?.MRData?.DriverTable?.Drivers || [];
};

exports.fetchCircuits = async () => {
  const res = await axios.get(`${ERGAST_BASE_URL}/circuits.json`);
  return res.data?.MRData?.CircuitTable?.Circuits || [];
};

exports.fetchDriverStandings = async () => {
  const res = await axios.get(`${ERGAST_BASE_URL}/driverStandings.json`);
  return res.data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
};
