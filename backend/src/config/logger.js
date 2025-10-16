const pino = require('pino');

// Configuração do Pino baseada no ambiente
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
          levelFirst: true,
          messageFormat: '{msg}'
        }
      }
    : undefined,
});

module.exports = logger;
