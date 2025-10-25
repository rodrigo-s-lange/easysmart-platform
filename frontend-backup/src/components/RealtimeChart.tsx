/**
 * RealtimeChart Component
 * 
 * Gráfico de linha em tempo real que:
 * - Acumula últimos N pontos de telemetria
 * - Atualiza automaticamente via WebSocket
 * - Suporta múltiplas linhas (entities)
 * - Animações suaves
 * 
 * Requer: npm install recharts
 */

import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';

interface DataPoint {
  timestamp: string;
  time: string;
  [key: string]: string | number;
}

interface EntityConfig {
  entityId: string;
  entityName: string;
  color: string;
}

interface RealtimeChartProps {
  deviceId: string;
  entities: EntityConfig[];
  maxDataPoints?: number;
  refreshInterval?: number;
  height?: number;
  title?: string;
  unit?: string;
}

export function RealtimeChart({
  deviceId,
  entities,
  maxDataPoints = 20,
  refreshInterval = 1000,
  height = 300,
  title,
  unit = '',
}: RealtimeChartProps) {
  const { telemetry, availability, isConnected, subscribe, unsubscribe } = useMqttTelemetry();
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const deviceStatus = availability.get(deviceId);

  // Subscribe em todas entities
  useEffect(() => {
    if (isConnected) {
      entities.forEach(entity => {
        subscribe(deviceId, entity.entityId);
      });
    }

    return () => {
      entities.forEach(entity => {
        unsubscribe(deviceId, entity.entityId);
      });
    };
  }, [deviceId, entities, isConnected, subscribe, unsubscribe]);

  // Atualizar dados do gráfico
  const updateChartData = useCallback(() => {
    const newPoint: DataPoint = {
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
    };

    // Adicionar valores de cada entity
    entities.forEach(entity => {
      const key = `${deviceId}:${entity.entityId}`;
      const data = telemetry.get(key);
      
      if (data && typeof data.value === 'number') {
        newPoint[entity.entityId] = Number(data.value.toFixed(2));
      } else {
        newPoint[entity.entityId] = 0;
      }
    });

    setChartData(prev => {
      const updated = [...prev, newPoint];
      // Manter apenas os últimos N pontos
      return updated.slice(-maxDataPoints);
    });
  }, [deviceId, entities, telemetry, maxDataPoints]);

  // Atualizar periodicamente
  useEffect(() => {
    if (!isConnected || deviceStatus !== 'online') return;

    const interval = setInterval(() => {
      updateChartData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isConnected, deviceStatus, refreshInterval, updateChartData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}{unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          <p className="text-sm text-gray-500">
            {chartData.length} / {maxDataPoints} pontos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            deviceStatus === 'online' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${
              deviceStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></span>
            {deviceStatus === 'online' ? 'Ao Vivo' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            formatter={(value) => {
              const entity = entities.find(e => e.entityId === value);
              return entity?.entityName || value;
            }}
          />
          
          {entities.map(entity => (
            <Line
              key={entity.entityId}
              type="monotone"
              dataKey={entity.entityId}
              stroke={entity.color}
              strokeWidth={2}
              dot={false}
              animationDuration={300}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Info */}
      {chartData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Aguardando dados...</p>
          <p className="text-sm mt-1">O gráfico será atualizado automaticamente</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO DE USO
// ============================================

export function RealtimeChartExample() {
  return (
    <RealtimeChart
      deviceId="esp32s3-lab"
      entities={[
        { entityId: 'temperature', entityName: 'Temperatura', color: '#ef4444' },
        { entityId: 'humidity', entityName: 'Umidade', color: '#3b82f6' },
      ]}
      maxDataPoints={30}
      refreshInterval={2000}
      height={400}
      title="Monitoramento Ambiental"
      unit="°C"
    />
  );
}
