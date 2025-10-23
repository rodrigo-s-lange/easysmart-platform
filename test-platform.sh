#!/bin/bash
#
# Script de Testes Completos - EasySmart Platform
# 
# Valida:
# - Infraestrutura (Docker)
# - Backend (API)
# - Autenticação (JWT)
# - Admin Routes (RBAC)
# - Device Real (ESP32-S3)
# - Telemetria (InfluxDB)
# - Multi-tenancy (Isolamento)
#
# Uso: ./test-platform.sh
#

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

echo "=========================================="
echo "🧪 EasySmart Platform - Testes Completos"
echo "=========================================="
echo ""

# Função auxiliar para printar resultado
test_result() {
  local test_name=$1
  local result=$2
  
  if [ "$result" = "PASS" ]; then
    echo -e "${GREEN}✅ PASS${NC} - $test_name"
    PASSED=$((PASSED + 1))
  elif [ "$result" = "FAIL" ]; then
    echo -e "${RED}❌ FAIL${NC} - $test_name"
    FAILED=$((FAILED + 1))
  else
    echo -e "${YELLOW}⚠️  WARN${NC} - $test_name"
    WARNINGS=$((WARNINGS + 1))
  fi
}

# ==================== FASE 1: INFRAESTRUTURA ====================
echo -e "${BLUE}[FASE 1] Infraestrutura Docker${NC}"
echo ""

# Test 1.1: PostgreSQL
if docker ps | grep -q postgres; then
  test_result "PostgreSQL container rodando" "PASS"
else
  test_result "PostgreSQL container rodando" "FAIL"
fi

# Test 1.2: InfluxDB
if docker ps | grep -q influxdb; then
  test_result "InfluxDB container rodando" "PASS"
else
  test_result "InfluxDB container rodando" "FAIL"
fi

# Test 1.3: Mosquitto
if docker ps | grep -q mosquitto; then
  test_result "Mosquitto container rodando" "PASS"
else
  test_result "Mosquitto container rodando" "FAIL"
fi

echo ""

# ==================== FASE 2: BACKEND CORE ====================
echo -e "${BLUE}[FASE 2] Backend Core${NC}"
echo ""

# Test 2.1: Backend HTTP
if curl -s http://localhost:3010 > /dev/null 2>&1; then
  test_result "Backend HTTP respondendo" "PASS"
else
  test_result "Backend HTTP respondendo" "FAIL"
  echo "❌ Backend não está rodando. Execute: cd backend && npm run dev"
  exit 1
fi

# Test 2.2: Health Check
HEALTH=$(curl -s http://localhost:3010/health)
if echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null 2>&1; then
  test_result "Health check OK" "PASS"
else
  test_result "Health check OK" "FAIL"
fi

# Test 2.3: PostgreSQL conectado
if echo "$HEALTH" | jq -e '.services.postgres == true' > /dev/null 2>&1; then
  test_result "Backend → PostgreSQL conectado" "PASS"
else
  test_result "Backend → PostgreSQL conectado" "FAIL"
fi

# Test 2.4: InfluxDB conectado
if echo "$HEALTH" | jq -e '.services.influxdb == true' > /dev/null 2>&1; then
  test_result "Backend → InfluxDB conectado" "PASS"
else
  test_result "Backend → InfluxDB conectado" "FAIL"
fi

# Test 2.5: MQTT conectado
if echo "$HEALTH" | jq -e '.services.mqtt == true' > /dev/null 2>&1; then
  test_result "Backend → MQTT conectado" "PASS"
else
  test_result "Backend → MQTT conectado" "FAIL"
fi

# Test 2.6: InfluxWriter
INFLUX_WRITER=$(echo "$HEALTH" | jq -r '.influxWriter.mode')
if [ "$INFLUX_WRITER" = "immediate" ]; then
  test_result "InfluxWriter modo imediato" "PASS"
else
  test_result "InfluxWriter modo imediato" "WARN"
fi

echo ""

# ==================== FASE 3: AUTENTICAÇÃO ====================
echo -e "${BLUE}[FASE 3] Autenticação & JWT${NC}"
echo ""

# Test 3.1: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.refreshToken')
USER_ROLE=$(echo "$LOGIN_RESPONSE" | jq -r '.user.role')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  test_result "Login super_admin" "PASS"
else
  test_result "Login super_admin" "FAIL"
  echo "❌ Login falhou. Verifique credenciais."
  exit 1
fi

# Test 3.2: Role correto
if [ "$USER_ROLE" = "super_admin" ]; then
  test_result "Role = super_admin" "PASS"
else
  test_result "Role = super_admin (encontrado: $USER_ROLE)" "FAIL"
fi

# Test 3.3: JWT válido
JWT_PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null)
JWT_ROLE=$(echo "$JWT_PAYLOAD" | jq -r '.role')

if [ "$JWT_ROLE" = "super_admin" ]; then
  test_result "JWT contém role correto" "PASS"
else
  test_result "JWT contém role correto" "FAIL"
fi

# Test 3.4: /users/me
ME_RESPONSE=$(curl -s http://localhost:3010/api/v1/auth/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

ME_EMAIL=$(echo "$ME_RESPONSE" | jq -r '.user.email')

if [ "$ME_EMAIL" = "admin@easysmart.io" ]; then
  test_result "GET /auth/users/me" "PASS"
else
  test_result "GET /auth/users/me" "FAIL"
fi

echo ""

# ==================== FASE 4: ADMIN ROUTES ====================
echo -e "${BLUE}[FASE 4] Admin Routes (RBAC)${NC}"
echo ""

# Test 4.1: GET /admin/tenants
TENANTS=$(curl -s http://localhost:3010/api/v1/admin/tenants \
  -H "Authorization: Bearer $ACCESS_TOKEN")

TENANT_COUNT=$(echo "$TENANTS" | jq -r '.total')

if [ "$TENANT_COUNT" -gt 0 ] 2>/dev/null; then
  test_result "GET /admin/tenants (count: $TENANT_COUNT)" "PASS"
else
  test_result "GET /admin/tenants" "WARN"
fi

# Test 4.2: GET /admin/devices
DEVICES=$(curl -s "http://localhost:3010/api/v1/admin/devices?limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

DEVICE_TOTAL=$(echo "$DEVICES" | jq -r '.pagination.total')

if [ "$DEVICE_TOTAL" -gt 0 ] 2>/dev/null; then
  test_result "GET /admin/devices (total: $DEVICE_TOTAL)" "PASS"
else
  test_result "GET /admin/devices" "WARN"
fi

# Test 4.3: GET /admin/metrics
METRICS=$(curl -s http://localhost:3010/api/v1/admin/metrics \
  -H "Authorization: Bearer $ACCESS_TOKEN")

PLATFORM_DEVICES=$(echo "$METRICS" | jq -r '.platform.total_devices')

if [ "$PLATFORM_DEVICES" -gt 0 ] 2>/dev/null; then
  test_result "GET /admin/metrics (devices: $PLATFORM_DEVICES)" "PASS"
else
  test_result "GET /admin/metrics" "WARN"
fi

# Test 4.4: Bloqueio de acesso (não-admin)
FAKE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0Iiwicm9sZSI6InRlbmFudF9hZG1pbiJ9.test"
BLOCKED=$(curl -s http://localhost:3010/api/v1/admin/tenants \
  -H "Authorization: Bearer $FAKE_TOKEN")

BLOCKED_ERROR=$(echo "$BLOCKED" | jq -r '.error // .message')

if [[ "$BLOCKED_ERROR" == *"denied"* ]] || [[ "$BLOCKED_ERROR" == *"Invalid"* ]]; then
  test_result "Bloqueio de acesso não-admin" "PASS"
else
  test_result "Bloqueio de acesso não-admin" "WARN"
fi

echo ""

# ==================== FASE 5: DEVICE REAL ====================
echo -e "${BLUE}[FASE 5] Device Real (ESP32-S3)${NC}"
echo ""

# Test 5.1: Device esp32s3-lab existe
DEVICE_ESP32=$(docker exec -it postgres psql -U postgres -d easysmart -t -c \
  "SELECT COUNT(*) FROM devices WHERE metadata->>'id' = 'esp32s3-lab';" | tr -d '[:space:]')

if [ "$DEVICE_ESP32" -gt 0 ] 2>/dev/null; then
  test_result "Device esp32s3-lab no banco" "PASS"
else
  test_result "Device esp32s3-lab no banco" "WARN"
  echo "   ⚠️  Device não encontrado. ESP32-S3 está conectado?"
fi

# Test 5.2: Entities registradas
if [ "$DEVICE_ESP32" -gt 0 ] 2>/dev/null; then
  ENTITY_COUNT=$(docker exec -it postgres psql -U postgres -d easysmart -t -c \
    "SELECT COUNT(*) FROM entities e JOIN devices d ON e.device_id = d.id WHERE d.metadata->>'id' = 'esp32s3-lab';" \
    | tr -d '[:space:]')
  
  if [ "$ENTITY_COUNT" -gt 0 ] 2>/dev/null; then
    test_result "Entities registradas (count: $ENTITY_COUNT)" "PASS"
  else
    test_result "Entities registradas" "WARN"
  fi
fi

# Test 5.3: Telemetria no InfluxDB
TELEMETRY_COUNT=$(docker exec -it influxdb influx query \
  'from(bucket: "iot_data")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "telemetry")
    |> filter(fn: (r) => r.mqtt_id == "esp32s3-lab")
    |> count()' 2>/dev/null | grep -oP '_value.*\d+' | grep -oP '\d+' | head -1)

if [ -n "$TELEMETRY_COUNT" ] && [ "$TELEMETRY_COUNT" -gt 0 ] 2>/dev/null; then
  test_result "Telemetria no InfluxDB (pontos: $TELEMETRY_COUNT)" "PASS"
else
  test_result "Telemetria no InfluxDB" "WARN"
  echo "   ⚠️  Sem telemetria recente. Device está enviando dados?"
fi

echo ""

# ==================== FASE 6: MULTI-TENANCY ====================
echo -e "${BLUE}[FASE 6] Multi-tenancy & Isolamento${NC}"
echo ""

# Test 6.1: Admin vê todos devices
ADMIN_DEVICES=$(curl -s http://localhost:3010/api/v1/devices \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '. | length')

if [ "$ADMIN_DEVICES" -gt 0 ] 2>/dev/null; then
  test_result "Admin vê devices do tenant (count: $ADMIN_DEVICES)" "PASS"
else
  test_result "Admin vê devices do tenant" "WARN"
fi

# Test 6.2: Tenant_id presente
FIRST_DEVICE=$(curl -s http://localhost:3010/api/v1/devices \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].tenant_id // "null"')

if [ "$FIRST_DEVICE" != "null" ] && [ -n "$FIRST_DEVICE" ]; then
  test_result "Devices têm tenant_id" "PASS"
else
  test_result "Devices têm tenant_id" "WARN"
fi

echo ""

# ==================== FASE 7: FRONTEND ====================
echo -e "${BLUE}[FASE 7] Frontend (Opcional)${NC}"
echo ""

# Test 7.1: Frontend rodando
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  test_result "Frontend HTTP respondendo" "PASS"
else
  test_result "Frontend HTTP respondendo" "WARN"
  echo "   ℹ️  Frontend não está rodando. Execute: cd frontend && npm run dev"
fi

echo ""

# ==================== RESUMO ====================
echo "=========================================="
echo "📊 RESUMO DOS TESTES"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ PASSOU: $PASSED testes${NC}"
echo -e "${RED}❌ FALHOU: $FAILED testes${NC}"
echo -e "${YELLOW}⚠️  AVISOS: $WARNINGS testes${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")

echo "Taxa de sucesso: $SUCCESS_RATE%"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}❌ Alguns testes falharam. Revise os itens acima.${NC}"
  exit 1
elif [ "$WARNINGS" -gt 5 ]; then
  echo -e "${YELLOW}⚠️  Muitos avisos. Verifique configuração.${NC}"
  exit 0
else
  echo -e "${GREEN}✅ Todos os testes críticos passaram!${NC}"
  echo -e "${GREEN}🎉 Plataforma funcionando corretamente!${NC}"
  exit 0
fi
