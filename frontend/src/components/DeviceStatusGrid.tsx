/**
 * DeviceStatusGrid Component
 * 
 * Grid que exibe múltiplos devices com:
 * - Status online/offline em tempo real
 * - Últimas telemetrias de cada device
 * - Ações rápidas (ver detalhes, controlar)
 * - Filtros e busca
 */

import { useState, useEffect, useMemo } from 'react';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';

interface Device {
  id: string;
  name: string;
  location?: string;
  type?: string;
  icon?: string;
  keyEntities?: string[]; // Entities principais para exibir
}

interface DeviceStatusGridProps {
  devices: Device[];
  onDeviceClick?: (deviceId: string) => void;
  columns?: number;
}

export function DeviceStatusGrid({
  devices,
  onDeviceClick,
  columns = 3,
}: DeviceStatusGridProps) {
  const { telemetry, availability, isConnected, subscribe, unsubscribe } = useMqttTelemetry();
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe em availability de todos devices
  useEffect(() => {
    if (isConnected) {
      devices.forEach(device => {
        subscribe(device.id); // Subscribe sem entityId = subscribe tudo do device
      });
    }

    return () => {
      devices.forEach(device => {
        unsubscribe(device.id);
      });
    };
  }, [devices, isConnected, subscribe, unsubscribe]);

  // Filtrar e buscar devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Filtro por status
      if (filter !== 'all') {
        const status = availability.get(device.id);
        if (filter === 'online' && status !== 'online') return false;
        if (filter === 'offline' && status === 'online') return false;
      }

      // Busca por nome ou location
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchName = device.name.toLowerCase().includes(search);
        const matchLocation = device.location?.toLowerCase().includes(search);
        return matchName || matchLocation;
      }

      return true;
    });
  }, [devices, filter, searchTerm, availability]);

  // Estatísticas
  const stats = useMemo(() => {
    const online = devices.filter(d => availability.get(d.id) === 'online').length;
    const offline = devices.length - online;
    return { total: devices.length, online, offline };
  }, [devices, availability]);

  // Grid columns CSS
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-3';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            <p className="text-sm text-gray-500">Online</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            <p className="text-sm text-gray-500">Offline</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('online')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'online'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setFilter('offline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'offline'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid ${gridCols} gap-4`}>
        {filteredDevices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            status={availability.get(device.id)}
            telemetry={telemetry}
            onClick={onDeviceClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">Nenhum device encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou a busca</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// DEVICE CARD (Subcomponente)
// ============================================

interface DeviceCardProps {
  device: Device;
  status?: string;
  telemetry: Map<string, any>;
  onClick?: (deviceId: string) => void;
}

function DeviceCard({ device, status, telemetry, onClick }: DeviceCardProps) {
  const isOnline = status === 'online';

  // Obter telemetrias principais
  const getKeyTelemetry = () => {
    if (!device.keyEntities) return [];
    
    return device.keyEntities.map(entityId => {
      const key = `${device.id}:${entityId}`;
      const data = telemetry.get(key);
      return {
        entityId,
        value: data?.value,
        timestamp: data?.timestamp,
      };
    }).filter(item => item.value !== undefined);
  };

  const keyData = getKeyTelemetry();

  return (
    <div
      className={`bg-white rounded-lg shadow border-2 transition-all duration-200 ${
        isOnline
          ? 'border-green-200 hover:border-green-400 hover:shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(device.id)}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isOnline ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{device.icon || '📡'}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{device.name}</h3>
              {device.location && (
                <p className="text-xs text-gray-500">{device.location}</p>
              )}
            </div>
          </div>
          
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isOnline
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`w-2 h-2 mr-1.5 rounded-full ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {keyData.length > 0 ? (
          <div className="space-y-2">
            {keyData.map(item => (
              <div key={item.entityId} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {item.entityId}:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {typeof item.value === 'number'
                    ? item.value.toFixed(1)
                    : String(item.value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            {isOnline ? 'Aguardando dados...' : 'Device offline'}
          </p>
        )}
      </div>

      {/* Footer */}
      {device.type && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500">{device.type}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXEMPLO DE USO
// ============================================

export function DeviceStatusGridExample() {
  const devices: Device[] = [
    {
      id: 'esp32s3-lab',
      name: 'ESP32-S3 Lab',
      location: 'Laboratório',
      type: 'Sensor Ambiental',
      icon: '🌡️',
      keyEntities: ['temperature', 'humidity'],
    },
    {
      id: 'esp32-office',
      name: 'ESP32 Escritório',
      location: 'Sala 101',
      type: 'Controle de Iluminação',
      icon: '💡',
      keyEntities: ['brightness', 'power'],
    },
    // Mais devices...
  ];

  return (
    <DeviceStatusGrid
      devices={devices}
      onDeviceClick={(deviceId) => {
        console.log('Device clicked:', deviceId);
        // Navegar para página de detalhes
      }}
      columns={3}
    />
  );
}
