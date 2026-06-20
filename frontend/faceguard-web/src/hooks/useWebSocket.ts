import { useEffect, useRef, useState } from "react";
import { websocketService } from "../services/websocket.service";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onMessage?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onMessage,
    onConnected,
    onDisconnected,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const handlersRef = useRef({ onMessage, onConnected, onDisconnected, onError });

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = { onMessage, onConnected, onDisconnected, onError };
  }, [onMessage, onConnected, onDisconnected, onError]);

  useEffect(() => {
    if (!autoConnect) return;

    // Connect
    websocketService.connect();

    // Setup event listeners
    function handleConnected() {
      setIsConnected(true);
      handlersRef.current.onConnected?.();
    }

    function handleDisconnected() {
      setIsConnected(false);
      handlersRef.current.onDisconnected?.();
    }

    function handleMessage(data: any) {
      handlersRef.current.onMessage?.(data);
    }

    function handleError(error: any) {
      handlersRef.current.onError?.(error);
    }

    websocketService.on("connected", handleConnected);
    websocketService.on("disconnected", handleDisconnected);
    websocketService.on("message", handleMessage);
    websocketService.on("error", handleError);

    // Check initial connection state
    setIsConnected(websocketService.isConnected());

    // Cleanup
    return () => {
      websocketService.off("connected", handleConnected);
      websocketService.off("disconnected", handleDisconnected);
      websocketService.off("message", handleMessage);
      websocketService.off("error", handleError);
    };
  }, [autoConnect]);

  return {
    isConnected,
    send: (data: any) => websocketService.send(data),
    connect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect(),
  };
}

export function useWebSocketEvent<T = any>(
  eventType: string,
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    function handleEvent(data: T) {
      callbackRef.current(data);
    }

    websocketService.on(eventType, handleEvent);

    return () => {
      websocketService.off(eventType, handleEvent);
    };
  }, [eventType]);
}
