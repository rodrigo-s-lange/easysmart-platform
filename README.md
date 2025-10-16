# easysmart-platform

Plataforma modular para IoT com foco em **simplicidade**, **multi-tenant**, e **telemetria**.  
Objetivo inicial: habilitar um **dispositivo básico (ESP32)** com **3 entidades**:
- `button` (ação simples)
- `slider` (controle numérico)
- `sensor_text` (leitura de texto/estado)

A **Dashboard Web** deve refletir as entidades disponíveis do dispositivo e permitir interação mínima (ligar/desligar, ajustar slider, exibir texto).

---

## 1. Stack (alvo)
- **Backend**: Node.js + Express
- **Broker**: Mosquitto (MQTT)
- **Time-series**: InfluxDB (telemetria futura)
- **Relacional**: PostgreSQL (usuários, tenants, dispositivos, entidades)
- **Frontend**: EJS (fase inicial) + JS vanilla (prototipação)
- **Auth**: JWT (simples, com middleware)
- **Infra**: Docker Compose (cada serviço isolado)

> Nesta versão inicial **não** conectaremos tudo de uma vez. Vamos por fases pequenas e testáveis.

---

## 2. Fases (micro-incrementos)

### Fase 0 — Projeto base
- [ ] Estrutura mínima de pastas
- [ ] `docker-compose.yml` com Mosquitto e Postgres **subindo**
- [ ] Backend Node **com rota /health** (OK/200)
- [ ] README atualizado a cada passo

### Fase 1 — Dispositivo básico (ESP32) e entidades
- [ ] Modelos: `Device`, `Entity` (tabelas mínimas)
- [ ] API: CRUD mínimo de Device (tenant único no início)
- [ ] Dashboard: listar devices e exibir **entidades** de um device
- [ ] Entidades suportadas (MVP): `button`, `slider`, `sensor_text`
- [ ] MQTT tópico padrão: `esp/<device_id>/<entity>` (definição simples)
- [ ] Handler básico de mensagens (log + echo para teste)

### Fase 2 — Interação real na dashboard
- [ ] UI básica para acionar `button` (publicar no MQTT)
- [ ] UI para mover `slider` (publicar no MQTT)
- [ ] UI para mostrar `sensor_text` (recebido via MQTT e refletido)

> InfluxDB e multi-tenant entram **depois do MVP** (evitar complexidade precoce).

---

## 3. Estrutura de pastas (planejada)
> Será criada gradualmente, **arquivo por arquivo**, com commit a cada criação.

iot/
├── README.md
├── docker/
│ ├── mosquitto/ # conf e persistência
│ ├── postgres/ # init.sql e dados
│ └── docker-compose.yml
├── server/ # backend Node
│ ├── package.json
│ ├── src/
│ │ ├── server.js
│ │ ├── routes/
│ │ ├── controllers/
│ │ ├── models/
│ │ ├── middleware/
│ │ └── services/
│ └── views/
│ ├── dashboard.ejs
│ └── partials/
└── web/ # estáticos (js/css) para EJS
├── js/
└── css/

markdown
Copiar código

> **Obs:** Nesta primeira etapa só teremos `README.md`. Os demais diretórios/arquivos serão criados conforme as fases.

---

## 4. Convenções
- **Commits**: pequenos, descritivos (ex.: `chore: init repo with blueprint readme`)
- **Passos**: um de cada vez; sempre atualizar o README
- **Config**: `.env` e secrets **fora** do repositório (usaremos `.env.example`)
- **MQTT**: manter nomes simples, `esp/<device_id>/<entity>`

---

## 5. Próximo passo sugerido
**Fase 0.1** — Criar `docker/docker-compose.yml` com **Mosquitto** e **Postgres** subindo, sem backend ainda.  
Depois disso, subir os containers e validar conectividade.

