require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const logger = require('./config/logger');
const { testConnection: testPostgres, closePool } = require('./config/database');
const { testConnection: testInflux, close: closeInflux } = require('./config/influxdb');
const { connect: connectMQTT, disconnect: disconnectMQTT, getStatus: getMQTTStatus } = require('./services/mqttService');
const influxService = require('./services/influxService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const adminRoutes = require('./routes/admin');
const telemetryRoutes = require('./routes/telemetry');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version,
    services: {
      postgres: false,
      influxdb: false,
      mqtt: false,
    },
    influxWriter: null,
  };

  try {
    try {
      await testPostgres();
      health.services.postgres = true;
    } catch (err) {
      logger.warn({ err }, 'PostgreSQL health check failed');
    }

    try {
      await testInflux();
      health.services.influxdb = true;
    } catch (err) {
      logger.warn({ err }, 'InfluxDB health check failed');
    }

    const mqttStatus = getMQTTStatus();
    health.services.mqtt = mqttStatus.connected;

    // Métricas do Influx Writer
    health.influxWriter = influxService.getMetrics();

    const allServicesOk = Object.values(health.services).every(status => status === true);
    health.status = allServicesOk ? 'ok' : 'degraded';

    const statusCode = allServicesOk ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    logger.error({ err }, 'Health check error');
    health.status = 'error';
    res.status(503).json(health);
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'EasySmart IoT Platform API',
    version: require('../package.json').version,
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      devices: '/api/v1/devices',
      telemetry: '/api/v1/telemetry',
    }
  });
});

// Rotas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    logger.info('🚀 Iniciando EasySmart Backend...');

    logger.info('📊 Conectando ao PostgreSQL...');
    await testPostgres();

    logger.info('📈 Conectando ao InfluxDB...');
    await testInflux();

    logger.info('📡 Conectando ao MQTT...');
    await connectMQTT();

    logger.info('💾 Iniciando Influx Writer (modo automático)');
if (typeof influxService.startWriter === 'function') {
  influxService.startWriter();
} else {
  logger.info('💾 InfluxService usando modo de escrita imediata (auto-flush).');
}


    const server = app.listen(PORT, () => {
      logger.info({
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      }, `🚀 EasySmart Backend running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info({ signal }, '⚠️  Shutdown signal recebido');

      server.close(async () => {
        logger.info('🔌 Servidor HTTP fechado');

        try {
          logger.info('🔌 Fechando conexões...');
          
          influxService.stopWriter();
          await influxService.close();
          await disconnectMQTT();
          await closeInflux();
          await closePool();

          logger.info('✅ Shutdown concluído');
          process.exit(0);
        } catch (err) {
          logger.error({ err }, '❌ Erro durante shutdown');
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('❌ Shutdown forçado após timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, '�� Uncaught Exception');
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, '💥 Unhandled Rejection');
      gracefulShutdown('unhandledRejection');
    });

  } catch (err) {
    logger.fatal({ err }, '❌ Falha ao iniciar servidor');
    process.exit(1);
  }
}

startServer();

module.exports = app;
