# 🤖 AI Context - EasySmart IoT Platform

**Use este documento para iniciar nova sessão com IA**

---

## 🎯 RESUMO EXECUTIVO

Projeto: **EasySmart IoT Platform**  
Tipo: **Multi-tenant SaaS IoT**  
Stack: **ESPHome + MQTT + Node.js + React + PostgreSQL + InfluxDB**  
Status: **Phase 1 - Backend em desenvolvimento**  
GitHub: https://github.com/rodrigo-s-lange/easysmart-platform

---

## 📊 ESTADO ATUAL (2025-10-16)

### ✅ INFRAESTRUTURA COMPLETA
Localização: `~/docker/docker-compose.yml`

Serviços rodando:
```
✅ PostgreSQL     localhost:5432   (metadata)
✅ InfluxDB       localhost:8086   (time-series)
✅ Mosquitto MQTT localhost:1883   (broker)
✅ ESPHome        localhost:6052   (firmware)
✅ Home Assistant localhost:8123   (opcional)
✅ Portainer      localhost:9000   (docker UI)
```

### ✅ REPOSITÓRIO LIMPO
Estrutura criada:
```
easysmart-platform/
├── backend/          # Node.js API (VAZIO - CRIAR)
├── frontend/         # React App (VAZIO - CRIAR)
├── esphome-examples/ # Device templates (VAZIO - CRIAR)
├── docs/             # Documentation
├── README.md         # ✅ Completo
├── CHANGELOG.md      # ✅ Completo
├── LICENSE           # ✅ MIT
└── .env.example      # ✅ Template
```

---

## 🎯 PRÓXIMA TAREFA

**Phase 1.1: Backend - Configurações Base**

Criar arquivos na ordem:

1. `backend/package.json`
   - Dependencies: express, pg, @influxdata/influxdb-client, mqtt, cors, helmet
   - Scripts: start, dev

2. `backend/.env` (copiar de ~/docker/.env)

3. `backend/src/config/database.js`
   - Conexão PostgreSQL usando pg
   - Pool connection
   - Test function

4. `backend/src/config/influxdb.js`
   - Cliente InfluxDB
   - Write/Query APIs
   - Test function

5. `backend/src/config/mqtt.js`
   - Cliente MQTT
   - Connect/Subscribe/Publish
   - Topic structure: easysmart/{DEVICE_ID}/{TYPE}/{ENTITY}/state

6. `backend/src/server.js`
   - Express app
   - Health check endpoint
   - Initialize connections
   - Port 3001

---

## 🔐 CREDENCIAIS

Localização: `~/docker/.env`

Variáveis importantes:
```env
POSTGRES_PASSWORD=lX9nbQpU3bxsahu0T3wmHiUX0tLVcET3xoVTVJc
INFLUXDB_ADMIN_TOKEN=e4f0394f5518b9fe5364c38f19ad5bebff394ae31dccfa334c5e1190e79f64fa
MQTT_PASSWORD=6XTPzoU1rt44dN6cVdqOAh2r5KNRi3yO3YO2aZZO8
```

**IMPORTANTE:** Backend usa `.env` próprio que referencia esses valores.

---

## 🏗️ ARQUITETURA
```
ESP32 (ESPHome YAML)
    ↓ MQTT
Mosquitto Broker
    ↓
    ├→ InfluxDB (sensor readings)
    ├→ PostgreSQL (device metadata)
    └→ Backend Node.js
            ↓
        Frontend React
```

### MQTT Topics Structure
```
easysmart/{DEVICE_ID}/sensor/{ENTITY_ID}/state
easysmart/{DEVICE_ID}/switch/{ENTITY_ID}/state
easysmart/{DEVICE_ID}/switch/{ENTITY_ID}/command
easysmart/{DEVICE_ID}/availability
```

### Database Strategy
- **PostgreSQL:** Users, Devices, Entities (metadata)
- **InfluxDB:** Sensor readings, State history (time-series)

---

## 📋 COMANDOS RÁPIDOS
```bash
# Entrar no servidor
ssh rodrigo@server.local

# Ver infraestrutura
cd ~/docker && docker compose ps

# Trabalhar no projeto
cd ~/easysmart-platform

# Atualizar do GitHub
git pull origin main

# Ver logs
docker logs postgres --tail 20
docker logs mosquitto --tail 20

# Testar MQTT
docker exec mosquitto mosquitto_pub -h localhost -u devices \
  -P '6XTPzoU1rt44dN6cVdqOAh2r5KNRi3yO3YO2aZZO8' \
  -t 'test' -m 'hello'
```

---

## 🤖 INSTRUÇÕES PARA IA

### Regras de Trabalho
1. **Aguardar confirmação** entre cada etapa
2. **Testar antes de prosseguir**
3. **Commits frequentes** (após cada feature funcional)
4. **Código completo** (sem TODOs ou placeholders)
5. **Usar EOF format** para criar arquivos grandes

### Formato de Arquivos
```bash
# Sempre usar este formato
cat > caminho/arquivo.js << 'EOF'
// código aqui
