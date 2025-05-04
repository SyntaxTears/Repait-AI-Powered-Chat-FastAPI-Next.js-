// API client for interacting with the backend

import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "An error occurred");
  }

  return response.json();
}

export async function registerUser(email: string, password: string) {
  return fetchWithAuth("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("token", data.access_token);

  return data;
}

export async function logoutUser() {
  localStorage.removeItem("token");
}

export async function getCurrentUser() {
  return fetchWithAuth("/auth/me");
}

// Sessions
export async function createSession(inputText?: string) {
  return fetchWithAuth("/sessions", {
    method: "POST",
    body: JSON.stringify({ input_text: inputText }),
  });
}

// Diagnostics
export async function connectDiagnosticWebSocket(
  sessionId: number,
  onMessage: (data: any) => void
) {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const ws = new WebSocket(
    `${API_URL.replace(
      "http",
      "ws"
    )}/ws/diagnostics/${sessionId}?token=${token}`
  );

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return ws;
}

// Parts prediction
export async function predictParts(sessionId: number) {
  return fetchWithAuth(`/predict-parts?session_id=${sessionId}`, {
    method: "POST",
  });
}

// Repair summary
export async function generateRepairSummary(sessionId: number, notes?: string) {
  return fetchWithAuth(
    `/summarize-order?session_id=${sessionId}${
      notes ? `&notes=${encodeURIComponent(notes)}` : ""
    }`,
    {
      method: "POST",
    }
  );
}
