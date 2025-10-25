
/**
 * EntitySensor
 * 
 * Componente reutilizável para exibir sensores numéricos
 * Ex: Temperatura, Umidade, Pressão, Luminosidade, etc
 */

interface EntitySensorProps {
  deviceId: string;
  entityId: string;
  name: string;
  value: any;
  unit?: string;
  icon?: string;
  precision?: number; // Casas decimais (padrão: 1)
}

export function EntitySensor({
  deviceId,
  entityId,
  name,
  value,
  unit = '',
  icon = '📊',
  precision = 1,
}: EntitySensorProps) {
  
  // Formatar valor numérico
  const formatValue = (): string => {
    if (value === undefined || value === null) {
      return '--';
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return String(value);
    }
    
    return numValue.toFixed(precision);
  };

  // Determinar cor baseado no tipo
  const getColor = (): string => {
    if (value === undefined || value === null) {
      return 'text-gray-400';
    }
    
    // Pode adicionar lógica de threshold aqui
    return 'text-blue-600 dark:text-blue-400';
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
      <div className="flex items-center gap-1">
        <span className={`text-2xl font-bold ${getColor()}`}>
          {formatValue()}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}