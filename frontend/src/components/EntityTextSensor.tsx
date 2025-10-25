/**
 * EntityTextSensor
 * 
 * Componente reutilizável para exibir sensores de texto
 * Ex: IP, MAC Address, Versão Firmware, Status, SSID, etc
 */

interface EntityTextSensorProps {
  deviceId: string;
  entityId: string;
  name: string;
  value: any;
  icon?: string;
  monospace?: boolean; // Para IPs, MACs, etc
}

export function EntityTextSensor({
  deviceId,
  entityId,
  name,
  value,
  icon = '📝',
  monospace = false,
}: EntityTextSensorProps) {
  
  // Formatar valor texto
  const formatValue = (): string => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return String(value);
  };

  // Determinar se é um valor "especial" que merece destaque
  const isSpecialValue = (): boolean => {
    const val = String(value).toLowerCase();
    return val.includes('error') || val.includes('warning') || val.includes('offline');
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Left Side - Nome */}
      <div className="flex items-center gap-2">
        <span className="text-xl" title={name}>{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {name}
        </span>
      </div>

      {/* Right Side - Valor */}
      <div className="flex items-center">
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            monospace ? 'font-mono' : ''
          } ${
            isSpecialValue()
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {formatValue()}
        </span>
      </div>
    </div>
  );
}