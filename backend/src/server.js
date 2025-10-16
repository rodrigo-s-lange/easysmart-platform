'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');

const { pool, testConnection } = require('./config/database');
const { testConnection: testInflux } = require('./config/influxdb');
const mqttConfig = require('./config/mqtt');   // <-- importa o módulo inteiro
const { initMqttService } = require('./services/mqttService');
const authRoutes = require('./routes/auth');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3010;

// ==================== MIDDLEWARES ====================
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(pinoHttp({ logger }));

// ==================== ROOT ====================
app.get('/', (req, res) => {
  res.json({
    message: 'EasySmart IoT Platform API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      devices: '/api/v1/devices'
    },
  });
});

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  const status = { postgres: false, influxdb: false, mqtt: false };

  const withTimeout = (fn, ms) =>
    Promise.race([
      fn().then(() => true).catch(() => false),
      new Promise(resolve => setTimeout(() => resolve(false), ms)),
    ]);

  try {
    status.postgres = await withTimeout(testConnection, 1000);
  } catch (e) {
    logger.error(e, 'Postgres check failed');
  }

  try {
    status.influxdb = await withTimeout(testInflux, 1000);
  } catch (e) {
    logger.error(e, 'InfluxDB check failed');
  }

  try {
    status.mqtt = mqttConfig.isMqttConnected();
  } catch (e) {
    logger.error(e, 'MQTT check failed');
  }

  const allOk = Object.values(status).every(Boolean);
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '0.1.0',
    services: status,
  });
});

// ==================== ROUTES ====================
app.use('/api/v1/auth', authRoutes);

// ==================== START SERVER ====================
(async () => {
  try {
    const client = await mqttConfig.initMqtt(); // <-- usa initMqtt do módulo
    if (client) {
      initMqttService(client); // <-- passa o client conectado
    } else {
      logger.warn('⚠️ MQTT não conectado — modo degradado');
    }

    app.listen(PORT, () => {
      logger.info(`🚀 EasySmart Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, 'Erro ao iniciar o servidor');
    process.exit(1);
  }
})();
