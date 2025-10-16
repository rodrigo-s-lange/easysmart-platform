# easysmart-platform

Plataforma modular para IoT com foco em simplicidade, escalabilidade e integração com Inteligência Artificial.  
Desenvolvida em Node.js, com persistência em PostgreSQL e mensageria MQTT (Mosquitto).  
Infraestrutura containerizada via Docker.

---

## 1. Arquitetura Atual

~/docker/iot
├── docker-compose.yml # Orquestra Postgres + Backend
├── mosquitto/ # Broker externo ativo (porta 1883)
├── postgres/ # Dados persistentes do PostgreSQL
│ └── data/
├── server/ # Backend Node.js
│ ├── src/
│ │ ├── server.js # API principal
│ │ └── config/database.js
│ ├── package.json
│ └── Dockerfile
└── README.md

yaml
Copiar código

**Stack ativa**
| Serviço | Porta | Função |
|----------|-------|--------|
| PostgreSQL | 5432 | Banco de dados relacional |
| Mosquitto | 1883 | Broker MQTT (externo, persistente) |
| easysmart-server | 3000 | API REST (Express + PostgreSQL) |

Rede Docker: `easysmart-net`

---

## 2. Diretrizes de Desenvolvimento

### Repositório
- Estrutura git limpa (`main` principal)
- Commits pequenos e descritivos (`feat`, `fix`, `chore`, `docs`, `build`)
- Atualizar o README a cada mudança estrutural
- Versionar apenas código e documentação — nunca dados ou segredos

### Ambiente
```bash
cd ~/docker/iot
docker compose up -d        # sobe containers
docker ps                   # verifica serviços
docker logs easysmart-server
Endpoints de teste:

bash
Copiar código
curl http://localhost:3000/health
curl http://localhost:3000/db-check
3. Diretrizes para LLMs (Assistentes de IA)
Propósito
LLMs atuam como copilotos técnicos: geram, revisam e documentam código.
Sempre seguem os princípios abaixo.

Regras de interação

Executar um passo por vez, confirmando a saída antes de avançar.

Utilizar blocos únicos de comando ou arquivo — evitar EOF fragmentado.

Sempre indicar caminho completo (~/docker/iot/...).

Commits após cada alteração significativa.

Documentação obrigatória no README.

Estilo de prompt

Específico e técnico

Usar linguagem direta, sem redundância

Preferência por exemplos completos e consistentes

Evitar emojis e informalidade em documentação

4. Plano de Ação – Próxima Sessão
Objetivo geral
Iniciar a camada de dados e comunicação do MVP (fase 1).

Tarefas
Etapa	Descrição	Status
1	Criar schema inicial do banco (Device, Entity)	pendente
2	Implementar modelos e migrations simples	pendente
3	Adicionar rotas de CRUD em /api/devices	pendente
4	Conectar backend ao broker MQTT (publicar/assinar)	pendente
5	Iniciar dashboard minimal (EJS) com 3 entidades básicas	pendente
6	Documentar fluxo e endpoints no README	pendente

Entregáveis esperados
Banco com tabela devices funcional

API GET /api/devices retornando lista mockada

Backend publicando mensagem MQTT de teste

Estrutura base de dashboard conectada

5. Próximos passos técnicos
Criar ~/docker/iot/server/src/models/device.js

Adicionar script SQL inicial em postgres/init/init.sql

Implementar rota /api/devices no Express

Configurar cliente MQTT dentro do backend

Validar comunicação fim a fim (MQTT ↔ Backend ↔ API)

6. Referências e boas práticas
Node.js + Express – API REST modular

PostgreSQL – persistência relacional

Mosquitto MQTT – mensagens entre dispositivos e backend

Docker Compose – orquestração local

Git e VS Code Remote SSH – fluxo de desenvolvimento remoto

Documentação viva – manter este README atualizado

