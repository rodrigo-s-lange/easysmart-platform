/**
 * useDevices Hook
 *
 * Hook para buscar e gerenciar devices da API
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Device, DevicesResponse } from '../types';

interface UseDevicesOptions {
  status?: 'online' | 'offline';
  limit?: number;
  offset?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // em ms
}

interface UseDevicesReturn {
  devices: Device[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
}

export function useDevices(options: UseDevicesOptions = {}): UseDevicesReturn {
  const {
    status,
    limit = 50,
    offset = 0,
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
  } = options;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = { limit, offset };
      if (status) params.status = status;

      const response = await api.get<DevicesResponse>('/api/v1/devices', { params });

      setDevices(response.data.devices || []);
      setTotal(response.data.total || 0);
      setHasMore(response.data.pagination?.hasMore || false);

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Falha ao carregar devices';
      setError(errorMessage);
      console.error('[useDevices] Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  }, [status, limit, offset]);

  // Fetch inicial
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDevices();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDevices]);

  return {
    devices,
    loading,
    error,
    total,
    hasMore,
    refetch: fetchDevices,
  };
}
