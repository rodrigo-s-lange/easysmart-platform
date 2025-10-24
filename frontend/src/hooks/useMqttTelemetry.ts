/**
 * useMqttTelemetry Hook
 * 
 * Hook React para receber telemetria em tempo real via WebSocket.
 * Versão final sem erros TypeScript.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface TelemetryData {
  type: 'telemetry';
  deviceId: string;
  entityType: string;
  entityId: string;
  value: number | string | boolean;
  timestamp: string;
}

interface AvailabilityData {
  type: 'availability';
  deviceId: string;
  status: 'online' | 'offline';
  timestamp: string;
}

interface WelcomeMessage {
  type: 'welcome';
  connectionId: string;
  message: string;
}

interface AuthSuccessMessage {
  type: 'auth_success';
  userId: string;
  role: string;
}

interface SubscribedMessage {
  type: 'subscribed';
  deviceId: string;
  entityId?: string;
}

interface UnsubscribedMessage {
  type: 'unsubscribed';
  deviceId: string;
  entityId?: string;
}

interface PongMessage {
  type: 'pong';
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

type WebSocketMessage =
  | TelemetryData
  | AvailabilityData
  | WelcomeMessage
  | AuthSuccessMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | PongMessage
  | ErrorMessage;

interface UseMqttTelemetryReturn {
  telemetry: Map<string, TelemetryData>;
  availability: Map<string, string>;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: (deviceId: string, entityId?: string) => void;
  unsubscribe: (deviceId: string, entityId?: string) => void;
  isConnected: boolean;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3010/ws/telemetry';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useMqttTelemetry(): UseMqttTelemetryReturn {
  const [telemetry, setTelemetry] = useState<Map<string, TelemetryData>>(new Map());
  const [availability, setAvailability] = useState<Map<string, string>>(new Map());
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isAuthenticatedRef = useRef(false);

  /**
   * Obter token do localStorage
   */
  const getAccessToken = useCallback((): string | null => {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.accessToken || null;
      }
    } catch (err) {
      console.error('[WS] Error reading token:', err);
    }
    return null;
  }, []);

  /**
   * Handle telemetria
   */
  const handleTelemetry = useCallback((data: TelemetryData) => {
    const key = `${data.deviceId}:${data.entityId}`;
    
    setTelemetry((prev) => {
      const next = new Map(prev);
      next.set(key, data);
      return next;
    });

    console.log('[WS] Telemetry:', key, data.value);
  }, []);

  /**
   * Handle availability
   */
  const handleAvailability = useCallback((data: AvailabilityData) => {
    setAvailability((prev) => {
      const next = new Map(prev);
      next.set(data.deviceId, data.status);
      return next;
    });

    console.log('[WS] Availability:', data.deviceId, data.status);
  }, []);

  /**
   * Handle mensagens do WebSocket
   */
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'welcome':
        console.log('[WS] Welcome:', message.message);
        break;

      case 'auth_success':
        console.log('[WS] Authenticated as user:', message.userId);
        isAuthenticatedRef.current = true;
        break;

      case 'telemetry':
        handleTelemetry(message);
        break;

      case 'availability':
        handleAvailability(message);
        break;

      case 'subscribed':
        console.log('[WS] Subscribed:', message.deviceId, message.entityId);
        break;

      case 'unsubscribed':
        console.log('[WS] Unsubscribed:', message.deviceId, message.entityId);
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'error':
        console.error('[WS] Server error:', message.error);
        break;

      default:
        console.warn('[WS] Unknown message type:', message);
    }
  }, [handleTelemetry, handleAvailability]);

  /**
   * Conectar ao WebSocket
   */
  const connect = useCallback(() => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      console.warn('[WS] No access token, skipping connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    console.log('[WS] Connecting to', WS_URL);
    setStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Autenticar
        ws.send(JSON.stringify({
          type: 'auth',
          token: accessToken,
        }));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          handleMessage(message);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = () => {
        console.error('[WS] Connection error');
        setStatus('error');
      };

      ws.onclose = () => {
        console.log('[WS] Connection closed');
        setStatus('disconnected');
        isAuthenticatedRef.current = false;
        wsRef.current = null;

        // Tentar reconectar
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`[WS] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else {
          console.error('[WS] Max reconnect attempts reached');
        }
      };

    } catch (err) {
      console.error('[WS] Connection failed:', err);
      setStatus('error');
    }
  }, [getAccessToken, handleMessage]);

  /**
   * Subscribe em device/entity
   */
  const subscribe = useCallback((deviceId: string, entityId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected, cannot subscribe');
      return;
    }

    if (!isAuthenticatedRef.current) {
      console.warn('[WS] Not authenticated, cannot subscribe');
      return;
    }

    console.log('[WS] Subscribing:', deviceId, entityId);

    wsRef.current.send(JSON.stringify({
      type: 'subscribe',
      deviceId,
      entityId,
    }));
  }, []);

  /**
   * Unsubscribe
   */
  const unsubscribe = useCallback((deviceId: string, entityId?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log('[WS] Unsubscribing:', deviceId, entityId);

    wsRef.current.send(JSON.stringify({
      type: 'unsubscribe',
      deviceId,
      entityId,
    }));
  }, []);

  /**
   * Conectar ao montar
   */
  useEffect(() => {
    connect();

    return () => {
      console.log('[WS] Cleaning up');
      
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  /**
   * Heartbeat ping
   */
  useEffect(() => {
    if (status !== 'connected') return;

    const interval = window.setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 segundos

    return () => window.clearInterval(interval);
  }, [status]);

  return {
    telemetry,
    availability,
    status,
    subscribe,
    unsubscribe,
    isConnected: status === 'connected' && isAuthenticatedRef.current,
  };
}