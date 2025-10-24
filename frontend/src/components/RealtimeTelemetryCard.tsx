/**
 * RealtimeTelemetryCard Component
 * 
 * Exemplo de componente que exibe telemetria em tempo real.
 * Usa o hook useMqttTelemetry para receber dados via WebSocket.
 */

import { useEffect } from 'react';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';

interface RealtimeTelemetryCardProps {
  deviceId: string;
  entityId: string;
  entityName: string;
  unit?: string;
}

export function RealtimeTelemetryCard({
  deviceId,
  entityId,
  entityName,
  unit = '',
}: RealtimeTelemetryCardProps) {
  const { telemetry, availability, status, subscribe, unsubscribe, isConnected } = useMqttTelemetry();

  // Subscribe ao montar
  useEffect(() => {
    if (isConnected) {
      subscribe(deviceId, entityId);
    }

    return () => {
      unsubscribe(deviceId, entityId);
    };
  }, [deviceId, entityId, isConnected, subscribe, unsubscribe]);

  // Obter dados atuais
  const key = `${deviceId}:${entityId}`;
  const data = telemetry.get(key);
  const deviceStatus = availability.get(deviceId);

  // Status badge
  const getStatusBadge = () => {
    if (!isConnected) {
      return (
        <span className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600">
          Desconectado
        </span>
      );
    }
    if (deviceStatus === 'offline') {
      return (
        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
          Offline
        </span>
      );
    }
    if (deviceStatus === 'online') {
      return (
        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
          Online
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-600">
        Aguardando...
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{entityName}</h3>
        {getStatusBadge()}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Valor atual */}
        <div className="text-3xl font-bold text-gray-900">
          {data ? (
            <>
              {typeof data.value === 'number' 
                ? data.value.toFixed(1) 
                : String(data.value)}
              {unit && <span className="text-xl text-gray-500 ml-1">{unit}</span>}
            </>
          ) : (
            <span className="text-gray-400">--</span>
          )}
        </div>

        {/* Timestamp */}
        {data && (
          <div className="text-xs text-gray-500">
            Última atualização: {new Date(data.timestamp).toLocaleTimeString('pt-BR')}
          </div>
        )}

        {/* Status de conexão */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-green-500' : 
            status === 'connecting' ? 'bg-yellow-500' : 
            'bg-red-500'
          }`} />
          <span className="text-gray-500 capitalize">{status}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXEMPLO DE USO EM UMA PÁGINA
// ============================================

export function DeviceDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Dashboard em Tempo Real</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <RealtimeTelemetryCard
          deviceId="esp32s3-lab"
          entityId="temperature"
          entityName="Temperatura"
          unit="°C"
        />

        <RealtimeTelemetryCard
          deviceId="esp32s3-lab"
          entityId="humidity"
          entityName="Umidade"
          unit="%"
        />

        <RealtimeTelemetryCard
          deviceId="esp32s3-lab"
          entityId="button"
          entityName="Botão"
        />
      </div>
    </div>
  );
}