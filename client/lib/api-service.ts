import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

export class ApiService {
  private static socket: WebSocket | null = null;

  static async startDiagnosticSession(vehicleData: any): Promise<string> {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/diagnostic/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      throw new Error("Failed to start diagnostic session");
    }

    const data = await response.json();
    return data.session_id;
  }

  static connectDiagnosticWebSocket(
    sessionId: number,
    onChunkReceived: (chunk: string) => void,
    onDiagnosticComplete: (result: string) => void,
    onError: (error: string) => void
  ): WebSocket | null {
    const token = getToken();
    console.log("Connecting WebSocket with session ID:", sessionId);

    if (!token) {
      console.error("No authentication token found");
      onError("No authentication token found");
      return null;
    }

    const socket = new WebSocket(
      `${WS_URL}/ws/diagnostics/${sessionId}?token=${token}`
    );

    socket.onopen = () => {
      console.log("Diagnostic WebSocket connection established");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        if (data.chunk) {
          onChunkReceived(data.chunk);
        } else if (data.complete) {
          onDiagnosticComplete(data.result);
        } else if (data.error) {
          console.error("WebSocket error in message:", data.error);
          onError(data.error);
        } else if (data.session_id) {
          console.log("New session created:", data.session_id);
        }
      } catch (parseError) {
        console.error(
          "Error parsing WebSocket message:",
          parseError,
          event.data
        );
        onError("Invalid message format");
      }
    };

    socket.onerror = (error) => {
      console.error("Diagnostic WebSocket error:", error);
      onError("WebSocket connection error");
    };

    socket.onclose = (event) => {
      console.log(
        "Diagnostic WebSocket connection closed:",
        event.code,
        event.reason
      );
      if (event.code !== 1000) {
        onError(`WebSocket closed unexpectedly: ${event.reason}`);
      }
    };

    return socket;
  }

  static sendDiagnosticMessage(socket: WebSocket, message: string): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ input: message }));
    } else {
      console.error("WebSocket is not open");
    }
  }

  static async getPredictedParts(sessionId: string): Promise<any[]> {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch predicted parts");
    }

    const data = await response.json();
    return data.parts || [];
  }

  static async getDiagnosticSessions(): Promise<any[]> {
    const token = getToken();
    console.log("Token for sessions request:", token ? "Exists" : "Missing");
    const response = await fetch(`${BASE_URL}/sessions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(
        "Sessions request failed:",
        response.status,
        response.statusText
      );
      throw new Error("Failed to fetch diagnostic sessions");
    }

    return await response.json();
  }

  static async getDiagnosticSession(sessionId: number): Promise<any> {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch diagnostic session details");
    }

    return await response.json();
  }

  static closeWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
