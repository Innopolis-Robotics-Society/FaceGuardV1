import {
  Person,
  Event,
  HealthResponse,
  TrainModelResponse,
  DoorResponse,
  ApiError,
} from "./types";

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private eventListeners: Set<(event: Event) => void> = new Set();

  constructor(
    baseUrl: string = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
    apiKey: string = import.meta.env.VITE_API_KEY || "your-api-key",
    wsUrl: string = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws"
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.wsUrl = wsUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(response.status, errorData.detail || "Request failed", errorData);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, error instanceof Error ? error.message : "Unknown error");
    }
  }

  // Health & Status
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("GET", "/health");
  }

  // People Management
  async getPeople(): Promise<Person[]> {
    return this.request<Person[]>("GET", "/people");
  }

  async addPerson(personId: string, displayName: string): Promise<Person> {
    return this.request<Person>("POST", "/people/{id}/capture", {
      person_id: personId,
      display_name: displayName,
    });
  }

  // Events & Logs
  async getEvents(limit: number = 100): Promise<Event[]> {
    return this.request<Event[]>("GET", `/events?limit=${limit}`);
  }

  // Model Training
  async trainModel(): Promise<TrainModelResponse> {
    return this.request<TrainModelResponse>("POST", "/recognition/train");
  }

  // Door Control
  async openDoor(): Promise<DoorResponse> {
    return this.request<DoorResponse>("POST", "/door/open");
  }

  // WebSocket Management
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "event" && data.data) {
              this.eventListeners.forEach((listener) => listener(data.data));
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(new ApiError(0, "WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.attemptReconnect();
        };
      } catch (error) {
        reject(new ApiError(0, "Failed to create WebSocket"));
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connectWebSocket().catch(console.error), this.reconnectDelay);
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onEvent(listener: (event: Event) => void) {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const apiClient = new ApiClient();
