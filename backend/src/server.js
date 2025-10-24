require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const mqttService = require('./services/mqttService');
const wsGateway = require('./services/wsGateway');

// Routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const telemetryRoutes = require('./routes/telemetry');
const adminRoutes = require('./routes/admin');

// Middleware
const { authenticate } = require('./middleware/authenticate');
const { requireSuperAdmin } = require('./middleware/requireSuperAdmin');

const app = express();
const PORT = process.env.PORT || 3010;

// ============================================
// MIDDLEWARES
// ============================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/devices', authenticate, deviceRoutes);
app.use('/api/v1/telemetry', authenticate, telemetryRoutes);
app.use('/api/v1/admin', authenticate, requireSuperAdmin, adminRoutes);

// WebSocket stats endpoint
app.get('/api/v1/ws/stats', authenticate, requireSuperAdmin, (req, res) => {
  res.json(wsGateway.getStats());
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📡 API disponível em http://localhost:${PORT}/api/v1`);
  logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Iniciar MQTT Service
mqttService.connect();

// Iniciar WebSocket Gateway
wsGateway.start(server);
wsGateway.startHeartbeat();
logger.info(`🔌 WebSocket disponível em ws://localhost:${PORT}/ws/telemetry`);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = (signal) => {
  logger.info(`${signal} recebido, iniciando shutdown graceful...`);

  // Fechar servidor HTTP
  server.close(() => {
    logger.info('✅ Servidor HTTP fechado');

    // Fechar MQTT
    mqttService.disconnect();
    logger.info('✅ MQTT desconectado');

    // Fechar WebSocket
    wsGateway.close();
    logger.info('✅ WebSocket fechado');

    logger.info('👋 Shutdown completo');
    process.exit(0);
  });

  // Forçar shutdown após 10 segundos
  setTimeout(() => {
    logger.error('⚠️ Shutdown forçado após timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    type: 'unhandledRejection',
    reason,
    promise,
  });
});

process.on('uncaughtException', (error) => {
  logger.error({
    type: 'uncaughtException',
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

module.exports = app;