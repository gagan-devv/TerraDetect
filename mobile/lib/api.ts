const BASE =
  process.env.EXPO_PUBLIC_BASE_URL || "https://terradetect.onrender.com";

async function request(
  path: string,
  opts: RequestInit = {},
  token?: string | null,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");

  return json;
}

export const api = {
  login: (body: object) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: object) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  refresh: (refreshToken: string) =>
    request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
  latestSensor: (token: string) => request("/api/v1/sensor/latest", {}, token),
  sensorHistory: (token: string, page = 1) =>
    request(`/api/v1/sensor/history?page=${page}&per_page=20`, {}, token),
  predictCrop: (token: string, body: object) =>
    request(
      "/api/v1/predict/crop",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  weather: (token: string, lat: number, lon: number) =>
    request(`/api/v1/weather?lat=${lat}&lon=${lon}`, {}, token),
};
