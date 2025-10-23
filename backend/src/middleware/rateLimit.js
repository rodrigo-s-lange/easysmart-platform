/**
 * Rate Limiting Middleware
 * 
 * Protege endpoints contra abuso usando memória (desenvolvimento)
 * ou Redis (produção).
 * 
 * Estratégia:
 * - Login: 5 requests / 15min por IP
 * - Register: 3 requests / 1h por IP
 * - API geral: 100 requests / 15min por token
 * - Admin: 200 requests / 15min por token
 */

const logger = require('../config/logger');

// Store em memória (desenvolvimento)
// TODO: Migrar para Redis em produção
const store = new Map();

/**
 * Limpa entries expirados (GC)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (data.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000); // Limpa a cada 1 minuto

/**
 * Rate limiter factory
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100,                   // 100 requests
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);

    // Criar novo record ou resetar se expirou
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    }

    // Incrementar contador
    record.count += 1;

    // Headers informativos
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    // Checar limite
    if (record.count > max) {
      logger.warn({
        ip: req.ip,
        key,
        path: req.path,
        count: record.count,
        limit: max,
      }, 'Rate limit exceeded');

      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    // Callback para decrementar se request falhar
    const originalSend = res.send;
    res.send = function (data) {
      if (skipSuccessfulRequests && res.statusCode < 400) {
        record.count = Math.max(0, record.count - 1);
      }
      if (skipFailedRequests && res.statusCode >= 400) {
        record.count = Math.max(0, record.count - 1);
      }
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Presets comuns
 */

// Login: 5 tentativas a cada 15min por IP
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => `login:${req.ip}`,
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos
});

// Register: 3 cadastros por hora por IP
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many accounts created. Please try again in 1 hour.',
  keyGenerator: (req) => `register:${req.ip}`,
});

// API geral: 100 requests a cada 15min por usuário
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests. Please slow down.',
  keyGenerator: (req) => `api:${req.user?.userId || req.ip}`,
});

// Admin: 200 requests a cada 15min
const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Admin rate limit exceeded.',
  keyGenerator: (req) => `admin:${req.user?.userId}`,
});

// Device API (MQTT tokens): 1000 requests / 15min
const deviceLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Device rate limit exceeded.',
  keyGenerator: (req) => `device:${req.deviceToken || req.ip}`,
});

/**
 * Utilitário: Clear rate limit para um usuário (ex: após reset de senha)
 */
function clearRateLimit(key) {
  store.delete(key);
  logger.info({ key }, 'Rate limit cleared');
}

/**
 * Utilitário: Obter stats
 */
function getStats() {
  const stats = {
    totalKeys: store.size,
    activeIPs: 0,
    activeUsers: 0,
  };

  for (const [key] of store.entries()) {
    if (key.startsWith('login:') || key.startsWith('register:')) {
      stats.activeIPs += 1;
    } else if (key.startsWith('api:') || key.startsWith('admin:')) {
      stats.activeUsers += 1;
    }
  }

  return stats;
}

module.exports = {
  createRateLimiter,
  loginLimiter,
  registerLimiter,
  apiLimiter,
  adminLimiter,
  deviceLimiter,
  clearRateLimit,
  getStats,
};
