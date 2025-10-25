#!/bin/bash
# Script para limpar arquivos desnecessários do frontend

cd ~/easysmart-platform/frontend/src

echo "🗑️  Removendo arquivos desnecessários..."

# Remover duplicados e backups
rm -f App_with_provider.tsx
rm -f hooks/useMqttTelemetry_perfect.ts
rm -f hooks/useTelemetry.ts
rm -f pages/Dashboard.tsx
rm -f pages/RealtimePage.tsx
rm -f pages/TestWebSocket.tsx
rm -f pages/UnderConstruction.tsx
rm -f components/DeviceCard.tsx

# Remover backups se existirem
rm -f components/DeviceStatusGrid.tsx.bak*
rm -f components/RealtimeChart.tsx.bak*
rm -f components/RealtimeTelemetryCard.tsx.bak*
rm -f pages/DashboardPage.tsx.bak*

echo "✅ Limpeza concluída!"
echo ""
echo "📋 Arquivos mantidos:"
ls -1 pages/*.tsx
echo ""
ls -1 components/*.tsx
echo ""
ls -1 hooks/*.ts
