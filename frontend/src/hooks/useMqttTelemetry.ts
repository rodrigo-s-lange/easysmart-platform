/**
 * useMqttTelemetry Hook
 * 
 * Hook React para receber telemetria em tempo real via WebSocket.
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
  // Obter token do localStorage (ajuste conforme seu auth store)
  const getAccessToken = (): string | null => {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.accessToken || null;
      }
    } catch {
      return null;
    }
    return null;
  };

  const [telemetry, setTelemetry] = useState<Map<string, TelemetryData>>(new Map());
  const [availability, setAvailability] = useState<Map<string, string>>(new Map());
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isAuthenticatedRef = useRef(false);

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

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        setStatus('error');
      };

      ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason);
        setStatus('disconnected');
        isAuthenticatedRef.current = false;
        wsRef.current = null;

        // Tentar reconectar
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`[WS] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
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
  }, []);

  /**
   * Handle mensagens do WebSocket
   */
  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'welcome':
        console.log('[WS] Welcome:', message.message);
        break;

      case 'auth_success':
        console.log('[WS] Authenticated as user:', message.userId);
        isAuthenticatedRef.current = true;
        break;

      case 'telemetry':
        handleTelemetry(message as TelemetryData);
        break;

      case 'availability':
        handleAvailability(message as AvailabilityData);
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
        console.warn('[WS] Unknown message type:', message.type);
    }
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
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
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