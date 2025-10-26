/**
 * EntityChart - CORRIGIDO
 * 
 * Busca dados do backend e renderiza gráfico
 * Agora lida corretamente com response.data.data (array)
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';

interface EntityChartProps {
  deviceId: string;
  entityId: string;
  entityName: string;
  unit?: string;
}

interface DataPoint {
  timestamp: string;
  value: number;
}

export function EntityChart({ deviceId, entityId, entityName, unit }: EntityChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [deviceId, entityId]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/v1/telemetry/${deviceId}/${entityId}`, {
        params: {
          start: '-30m',
          window: '1m',
        },
      });

      // ✅ CORRIGIDO: Backend retorna { success, data: [...] }
      const rawData = response.data.data || [];

      const formattedData = rawData.map((point: any) => ({
        timestamp: new Date(point._time).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: parseFloat(point._value),
      }));

      setData(formattedData);
    } catch (err: any) {
      console.error('Erro ao buscar dados históricos:', err);
      setError(err.response?.data?.error || 'Falha ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Carregando histórico...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-red-500">
        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium">{error}</p>
        <button
          onClick={fetchHistoricalData}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-500">
        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>Sem dados nos últimos 30 minutos</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        📈 {entityName} - Últimos 30 minutos
        <span className="text-xs text-gray-500">({data.length} pontos)</span>
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            label={{
              value: unit || '',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9CA3AF' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#F3F4F6',
            }}
            formatter={(value: any) => [`${value} ${unit || ''}`, entityName]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
