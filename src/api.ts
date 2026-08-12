import type {
  AppointmentSummary,
  CallStartResponse,
  LoginResponse,
  TranscriptTurn,
  User,
  VoiceConfig
} from "./types";

const TOKEN_KEY = "gyaini_access_token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers = new Headers(init.headers || {});

  if (authenticated) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const body = JSON.parse(text);
      message = body.message || body.error || text;
    } catch {
      // Keep raw response.
    }
    throw new Error(message || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    },
    false
  );
}

export async function me(): Promise<User> {
  const result = await request<{ user: User }>("/api/auth/me");
  return result.user;
}

export async function logout(): Promise<void> {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

export async function getVoiceConfig(): Promise<VoiceConfig> {
  return request<VoiceConfig>("/api/voice/config");
}

export async function startCall(): Promise<CallStartResponse> {
  return request<CallStartResponse>("/api/calls/start", { method: "POST" });
}

export async function exchangeSdp(callId: string, offerSdp: string): Promise<string> {
  return request<string>("/api/qwen/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/sdp",
      "X-Call-Id": callId
    },
    body: offerSdp
  });
}

export async function sendTurn(
  callId: string,
  turn: TranscriptTurn
): Promise<AppointmentSummary> {
  const result = await request<{
    status: string;
    public_summary: AppointmentSummary;
  }>("/api/calls/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_id: callId, turn })
  });

  return result.public_summary;
}

export async function getSummary(callId: string): Promise<AppointmentSummary> {
  const result = await request<{ public_summary: AppointmentSummary }>(
    `/api/calls/${encodeURIComponent(callId)}/summary`
  );
  return result.public_summary;
}

export async function endCall(callId: string): Promise<void> {
  await request(`/api/calls/${encodeURIComponent(callId)}/end`, {
    method: "POST"
  });
}
