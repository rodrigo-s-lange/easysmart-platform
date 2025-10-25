/**
 * EntityBinarySwitch
 * 
 * Componente reutilizável para exibir sensores binários (binary_sensor)
 * Ex: Botão, Sensor de Presença, Porta, Janela, Motion, etc
 * 
 * NÃO controla - apenas exibe estado!
 */

interface EntityBinarySwitchProps {
  deviceId: string;
  entityId: string;
  name: string;
  value: any;
  icon?: string;
  onLabel?: string; // Label quando ON (padrão: "ON")
  offLabel?: string; // Label quando OFF (padrão: "OFF")
}

export function EntityBinarySwitch({
  deviceId,
  entityId,
  name,
  value,
  icon = '🔘',
  onLabel = 'ON',
  offLabel = 'OFF',
}: EntityBinarySwitchProps) {
  
  // Determinar estado
  const isOn = value === 'ON' || value === true || value === 1 || value === 'true';

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Left Side - Nome */}
      <div className="flex items-center gap-2">
        <span className="text-xl" title={name}>{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {name}
        </span>
      </div>

      {/* Right Side - Estado */}
      <div className="flex items-center">
        {/* Badge de Estado */}
        <span
          className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all ${
            isOn
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {isOn ? onLabel : offLabel}
        </span>
      </div>
    </div>
  );
}