/**
 * CollapsibleDeviceCard - VERSÃO FINAL v2
 * 
 * - Botão de gráfico ABAIXO do componente
 * - Botão de exportar CSV para entidades com histórico
 */

import { useState, useEffect } from 'react';
import { useMqttTelemetryContext } from '../providers/MqttTelemetryProvider';
import { EntityChart } from './EntityChart';
import { EntitySensor } from './EntitySensor';
import { EntityTextSensor } from './EntityTextSensor';
import { EntityBinarySwitch } from './EntityBinarySwitch';
import { EntityLightSwitch } from './EntityLightSwitch';
import { EntityRelaySwitch } from './EntityRelaySwitch';
import { EntitySlider } from './EntitySlider';
import api from '../lib/api';

interface Entity {
  id: string;
  name: string;
  type: 'sensor' | 'text_sensor' | 'binary_sensor' | 'light' | 'switch' | 'number';
  unit?: string;
  icon?: string;
  hasHistory?: boolean;
  min?: number;
  max?: number;
  step?: number;
  deviceClass?: string;
}

interface Device {
  id: string;
  name: string;
  location?: string;
  icon?: string;
  entities: Entity[];
}

interface CollapsibleDeviceCardProps {
  device: Device;
}

export function CollapsibleDeviceCard({ device }: CollapsibleDeviceCardProps) {
  const { telemetry, availability, subscribe, unsubscribe } = useMqttTelemetryContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const deviceStatus = availability.get(device.id) || 'unknown';
  const isOnline = deviceStatus === 'online';

  useEffect(() => {
    subscribe(device.id);
    fetchLastValues();
    
    return () => unsubscribe(device.id);
  }, [device.id, subscribe, unsubscribe]);

  const fetchLastValues = async () => {
    try {
      setLoadingInitial(true);
      
      const promises = device.entities.map(async (entity) => {
        try {
          const response = await api.get(
            `/api/v1/telemetry/${device.id}/latest/${entity.id}`
          );
          return {
            entityId: entity.id,
            value: response.data.value,
          };
        } catch (err) {
          return null;
        }
      });

      await Promise.all(promises);
      
    } catch (err) {
      console.error(`[${device.id}] Erro ao buscar valores:`, err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const toggleExpand = () => {
    if (isOnline) {
      setIsExpanded(!isExpanded);
    }
  };

  const toggleEntityChart = (entityId: string) => {
    setExpandedEntity(expandedEntity === entityId ? null : entityId);
  };

  // Exportar CSV
  const handleExportCSV = async (entity: Entity) => {
    try {
      // Buscar últimos 30 dias
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const response = await api.get(`/api/v1/telemetry/${device.id}/${entity.id}`, {
        params: {
          start: start.toISOString(),
          stop: end.toISOString(),
          window: '1m',
        },
      });

      // Converter para CSV
      const csvContent = convertToCSV(response.data, entity);
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${device.id}_${entity.id}_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`[${device.id}:${entity.id}] CSV exportado com sucesso!`);
    } catch (err: any) {
      console.error(`[${device.id}:${entity.id}] Erro ao exportar CSV:`, err);
      alert(err.response?.data?.error || 'Falha ao exportar dados');
    }
  };

  // Converter dados para CSV
  const convertToCSV = (data: any[], entity: Entity): string => {
    const headers = ['timestamp', 'device_id', 'entity_id', 'value', 'unit'];
    const rows = data.map((point) => [
      point._time,
      device.id,
      entity.id,
      point._value,
      entity.unit || '',
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
  };

  const renderEntity = (entity: Entity) => {
    const entityKey = `${device.id}:${entity.id}`;
    const value = telemetry.get(entityKey);

    const commonProps = {
      deviceId: device.id,
      entityId: entity.id,
      name: entity.name,
      value,
      icon: entity.icon,
    };

    switch (entity.type) {
      case 'sensor':
        return <EntitySensor {...commonProps} unit={entity.unit} />;
      case 'text_sensor':
        return <EntityTextSensor {...commonProps} />;
      case 'binary_sensor':
        return <EntityBinarySwitch {...commonProps} />;
      case 'light':
        return <EntityLightSwitch {...commonProps} />;
      case 'switch':
        if (entity.deviceClass === 'light') {
          return <EntityLightSwitch {...commonProps} />;
        }
        return <EntityRelaySwitch {...commonProps} />;
      case 'number':
        return (
          <EntitySlider
            {...commonProps}
            min={entity.min}
            max={entity.max}
            step={entity.step}
            unit={entity.unit}
          />
        );
      default:
        return <EntitySensor {...commonProps} unit={entity.unit} />;
    }
  };

  return (
    <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border-2 transition-all ${
      isOnline ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'
    }`}>
      {/* Header */}
      <div
        onClick={toggleExpand}
        className={`flex items-center justify-between p-4 transition-all ${
          isOnline 
            ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' 
            : 'cursor-not-allowed opacity-60'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl drop-shadow-lg">{device.icon || '📟'}</span>
          <div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">
              {device.name}
            </h3>
            {device.location && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📍 {device.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
              isOnline
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                : 'bg-gradient-to-r from-red-400 to-red-500 text-white'
            }`}
          >
            {isOnline ? '🟢 Online' : '�� Offline'}
          </span>

          {isOnline && (
            <svg
              className={`w-6 h-6 text-gray-500 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && isOnline && (
        <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {loadingInitial ? (
            <div className="p-12 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Carregando entidades...</span>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {device.entities.map((entity) => {
                const hasChart = expandedEntity === entity.id;

                return (
                  <div key={entity.id} className="space-y-2">
                    {/* Entity Component */}
                    {renderEntity(entity)}
                    
                    {/* Botões de ação ABAIXO */}
                    {entity.hasHistory && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleEntityChart(entity.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                          {hasChart ? 'Ocultar Gráfico' : 'Ver Gráfico'}
                        </button>

                        <button
                          onClick={() => handleExportCSV(entity)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all transform hover:scale-105"
                          title="Exportar últimos 30 dias"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Chart Expandido */}
                    {hasChart && entity.hasHistory && (
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-blue-200 dark:border-blue-800">
                        <EntityChart
                          deviceId={device.id}
                          entityId={entity.id}
                          entityName={entity.name}
                          unit={entity.unit}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mensagem quando offline */}
      {!isOnline && (
        <div className="p-6 text-center border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Device offline - Aguardando conexão
          </p>
        </div>
      )}
    </div>
  );
}
