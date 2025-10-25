import { useEffect } from 'react';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';

export default function TestWebSocket() {
  const { telemetry, availability, status, subscribe, isConnected } = useMqttTelemetry();

  useEffect(() => {
    console.log('[TEST] WebSocket status:', status);
    console.log('[TEST] Is connected:', isConnected);
  }, [status, isConnected]);

  useEffect(() => {
    if (isConnected) {
      console.log('[TEST] Subscribing to esp32s3-lab...');
      subscribe('esp32s3-lab');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    console.log('[TEST] Availability map:', availability);
    console.log('[TEST] Telemetry map:', telemetry);
  }, [availability, telemetry]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test</h1>
      <div className="space-y-2">
        <p>Status: {status}</p>
        <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
        <p>ESP32-S3 Status: {availability.get('esp32s3-lab') || 'unknown'}</p>
      </div>
    </div>
  );
}
