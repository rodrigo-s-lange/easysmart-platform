# easysmart-platform

Plataforma modular para IoT com foco em **simplicidade**, **multi-tenant**, e **telemetria**.  
A arquitetura é baseada em contêineres isolados e um backend Node.js conectado ao PostgreSQL e Mosquitto.

---

## 🌍 Estrutura de Pastas (2025)

~/docker/iot
├── docker-compose.yml # Compose unificado do projeto
├── mosquitto/ # Configuração e dados do broker MQTT
│ ├── config/
│ ├── data/
│ └── log/
├── postgres/ # Dados persistentes do PostgreSQL
│ └── data/
├── server/ # Backend Node.js (Express + PostgreSQL)
│ ├── src/
│ ├── package.json
│ ├── package-lock.json
│ └── node_modules/
└── README.md # Este arquivo (documentação do projeto)

yaml
Copiar código

---

## ⚙️ Stack Atual

| Serviço | Porta | Função |
|----------|--------|--------|
| **PostgreSQL** | 5432 | Banco de dados principal |
| **Mosquitto** | 1883 / 9001 | Broker MQTT (TCP + WebSocket) |
| **easysmart-server** | 3000 | Backend Node.js (API REST) |

Rede Docker usada: `easysmart-net`

---

## 🚀 Como subir o projeto

```bash
cd ~/docker/iot
docker compose up -d
Para verificar os serviços:

bash
Copiar código
docker ps
Testar backend:

bash
Copiar código
curl http://localhost:3000/health
curl http://localhost:3000/db-check
📦 Próximos passos
Dockerfile do backend → containerizar server/

Schemas iniciais → Device e Entity

Dashboard minimal → listar e interagir com entidades básicas (button, slider, sensor_text)

Persistência MQTT → logs no Postgres (telemetria futura)

