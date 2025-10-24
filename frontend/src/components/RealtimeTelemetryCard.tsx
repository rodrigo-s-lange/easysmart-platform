/**
 * RealtimeTelemetryCard Component
 * 
 * Card que exibe telemetria em tempo real com:
 * - Valor atual animado
 * - Status do device
 * - Timestamp da última atualização
 * - Indicador de conexão WebSocket
 */

import { useEffect, useState } from 'react';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';

interface RealtimeTelemetryCardProps {
  deviceId: string;
  entityId: string;
  entityName: string;
  unit?: string;
  icon?: string;
  minValue?: number;
  maxValue?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
}

export function RealtimeTelemetryCard({
  deviceId,
  entityId,
  entityName,
  unit = '',
  icon = '📊',
  minValue,
  maxValue,
  warningThreshold,
  dangerThreshold,
}: RealtimeTelemetryCardProps) {
  const { telemetry, availability, status, subscribe, unsubscribe, isConnected } = useMqttTelemetry();
  const [prevValue, setPrevValue] = useState<number | string | boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Detectar mudança de valor
  useEffect(() => {
    if (data && data.value !== prevValue) {
      setIsUpdating(true);
      setPrevValue(data.value);
      
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [data, prevValue]);

  // Determinar cor baseado no valor
  const getValueColor = (): string => {
    if (!data || typeof data.value !== 'number') return 'text-gray-900';
    
    if (dangerThreshold && data.value >= dangerThreshold) {
      return 'text-red-600';
    }
    if (warningThreshold && data.value >= warningThreshold) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  // Status badge
  const getStatusBadge = () => {
    if (!isConnected) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-gray-400"></span>
          Desconectado
        </span>
      );
    }
    if (deviceStatus === 'offline') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-red-500"></span>
          Offline
        </span>
      );
    }
    if (deviceStatus === 'online') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Online
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-500"></span>
        Aguardando...
      </span>
    );
  };

  // Calcular porcentagem (para barra de progresso)
  const getPercentage = (): number => {
    if (!data || typeof data.value !== 'number' || minValue === undefined || maxValue === undefined) {
      return 0;
    }
    const percentage = ((data.value - minValue) / (maxValue - minValue)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  // Formatar valor
  const formatValue = (): string => {
    if (!data) return '--';
    
    if (typeof data.value === 'number') {
      return data.value.toFixed(1);
    }
    if (typeof data.value === 'boolean') {
      return data.value ? 'ON' : 'OFF';
    }
    return String(data.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{entityName}</h3>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        {/* Valor Principal */}
        <div className="mb-4">
          <div className={`text-5xl font-bold ${getValueColor()} transition-all duration-300 ${
            isUpdating ? 'scale-110' : 'scale-100'
          }`}>
            {formatValue()}
            {unit && <span className="text-2xl text-gray-500 ml-2">{unit}</span>}
          </div>
          
          {/* Barra de Progresso (se min/max definidos) */}
          {minValue !== undefined && maxValue !== undefined && typeof data?.value === 'number' && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    dangerThreshold && data.value >= dangerThreshold
                      ? 'bg-red-500'
                      : warningThreshold && data.value >= warningThreshold
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${getPercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{minValue}{unit}</span>
                <span>{maxValue}{unit}</span>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {data && (
          <div className="text-sm text-gray-500 mb-3">
            <span className="font-medium">Última atualização:</span>{' '}
            {new Date(data.timestamp).toLocaleTimeString('pt-BR')}
          </div>
        )}

        {/* Status de Conexão WebSocket */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-500 animate-pulse' : 
              status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600 capitalize">{status}</span>
          </div>
          
          {isUpdating && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              Atualizando...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// VARIAÇÃO COMPACTA
// ============================================

export function RealtimeTelemetryCardCompact({
  deviceId,
  entityId,
  entityName,
  unit = '',
  icon = '📊',
}: Pick<RealtimeTelemetryCardProps, 'deviceId' | 'entityId' | 'entityName' | 'unit' | 'icon'>) {
  const { telemetry, availability, isConnected, subscribe, unsubscribe } = useMqttTelemetry();

  useEffect(() => {
    if (isConnected) subscribe(deviceId, entityId);
    return () => unsubscribe(deviceId, entityId);
  }, [deviceId, entityId, isConnected, subscribe, unsubscribe]);

  const key = `${deviceId}:${entityId}`;
  const data = telemetry.get(key);
  const deviceStatus = availability.get(deviceId);

  const formatValue = (): string => {
    if (!data) return '--';
    if (typeof data.value === 'number') return data.value.toFixed(1);
    if (typeof data.value === 'boolean') return data.value ? 'ON' : 'OFF';
    return String(data.value);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <span className={`w-2 h-2 rounded-full ${
          deviceStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
        }`}></span>
      </div>
      <div className="text-sm text-gray-600 mb-1">{entityName}</div>
      <div className="text-2xl font-bold text-gray-900">
        {formatValue()}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}