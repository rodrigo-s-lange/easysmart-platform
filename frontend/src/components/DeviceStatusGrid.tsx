import { useState, useEffect, useMemo } from 'react';
import { useMqttTelemetryContext } from '../providers/MqttTelemetryProvider';

interface Device {
  id: string;
  name: string;
  location?: string;
  type?: string;
  icon?: string;
  keyEntities?: string[];
}

interface DeviceStatusGridProps {
  devices: Device[];
  onDeviceClick?: (deviceId: string) => void;
}

export function DeviceStatusGrid({ devices, onDeviceClick }: DeviceStatusGridProps) {
  const { telemetry, availability, isConnected, subscribe, unsubscribe } = useMqttTelemetryContext();
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [search, setSearch] = useState('');

  // Subscribe a todos os devices
  useEffect(() => {
    devices.forEach(device => {
      subscribe(device.id);
    });

    return () => {
      devices.forEach(device => {
        unsubscribe(device.id);
      });
    };
  }, [devices, subscribe, unsubscribe]);

  // Filtrar devices
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // Filtro de status
      if (filter !== 'all') {
        const status = availability.get(device.id);
        if (filter === 'online' && status !== 'online') return false;
        if (filter === 'offline' && status === 'online') return false;
      }

      // Busca
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          device.name.toLowerCase().includes(searchLower) ||
          device.location?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [devices, filter, search, availability]);

  // Stats
  const stats = useMemo(() => {
    const online = devices.filter(d => availability.get(d.id) === 'online').length;
    const offline = devices.length - online;
    return { total: devices.length, online, offline };
  }, [devices, availability]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Online</div>
          <div className="text-2xl font-bold text-green-600">{stats.online}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">Offline</div>
          <div className="text-2xl font-bold text-red-600">{stats.offline}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar device..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Todos</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map(device => {
          const status = availability.get(device.id) || 'unknown';
          const isOnline = status === 'online';

          return (
            <div
              key={device.id}
              onClick={() => onDeviceClick?.(device.id)}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{device.icon || '📟'}</span>
                  <div>
                    <div className="font-semibold">{device.name}</div>
                    <div className="text-sm text-gray-500">{device.location}</div>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    isOnline
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {/* Telemetry */}
              {isOnline && device.keyEntities && (
                <div className="mt-2 space-y-1">
                  {device.keyEntities.map(entityId => {
                    const value = telemetry.get(`${device.id}:${entityId}`);
                    return value !== undefined ? (
                      <div key={entityId} className="text-sm">
                        <span className="text-gray-500">{entityId}:</span>{' '}
                        <span className="font-semibold">{value}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
