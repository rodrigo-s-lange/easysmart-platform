// frontend/src/hooks/useTelemetry.ts
import { useEffect, useState } from "react";
import api from "../lib/api";

interface TelemetryPoint {
  _time: string;
  _value: number;
  entity_id: string;
  device_uuid: string;
}

export function useTelemetry(deviceId: string, entityId: string) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId || !entityId) return;

    const fetchLatest = async () => {
      try {
        const { data } = await api.get(`/api/v1/telemetry/${deviceId}/latest/${entityId}`);
        if (data?.success && data?.result?._value != null) {
          setValue(data.result._value);
        } else {
          console.warn("[Telemetry] No data found");
          setValue(null);
        }
      } catch (err: any) {
        console.error("[Telemetry] Fetch error:", err);
        setError("Erro ao buscar telemetria");
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 10000); // atualiza a cada 10s

    return () => clearInterval(interval);
  }, [deviceId, entityId]);

  return { value, loading, error };
}

export default useTelemetry;
