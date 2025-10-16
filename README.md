# easysmart-platform

Plataforma modular para IoT com foco em **simplicidade**, **multi-tenant** e **telemetria**.  
Arquitetura baseada em contêineres (Docker) e backend Node.js integrado a PostgreSQL e Mosquitto.

---

## 🌍 Estrutura de Pastas (estado atual)

```
~/docker/iot
├── docker-compose.yml     # Compose unificado do projeto
├── mosquitto/             # Config e dados do broker MQTT
│   ├── config/
│   ├── data/
│   └── log/
├── postgres/              # Dados persistentes do PostgreSQL
│   └── data/
├── server/                # Backend Node.js (Express + PostgreSQL)
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── node_modules/
└── README.md
```

---

## ⚙️ Stack

| Serviço            | Porta        | Função                         |
|--------------------|-------------:|--------------------------------|
| PostgreSQL         | 5432         | Banco relacional               |
| Mosquitto          | 1883 / 9001  | Broker MQTT (TCP / WS)         |
| easysmart-server   | 3000         | Backend Node.js (API REST)     |

Rede Docker: `easysmart-net`

---

## 🚀 Subir o projeto

```bash
cd ~/docker/iot
docker compose up -d
```

Verificar:
```bash
docker ps
```

Testar backend (se já containerizado):
```bash
curl http://localhost:3000/health
curl http://localhost:3000/db-check
```

---

## 📦 Próximos passos
1. **Dockerfile do backend** (containerizar `server/`)  
2. **Schemas iniciais**: `Device` e `Entity`  
3. **Dashboard mínima**: entidades `button`, `slider`, `sensor_text`  
4. **MQTT → Backend**: publicar/assinar tópicos e refletir na UI
