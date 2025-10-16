'use strict';

const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const { registerDiscovery } = require('../controllers/deviceController');

/**
 * Inicia o serviço MQTT listener.
 * @param {import('mqtt').MqttClient} client - Instância MQTT já conectada.
 */
function initMqttService(client) {
  if (!client) {
    logger.error('MQTT client não inicializado — initMqttService() recebeu undefined');
    return;
  }

  client.subscribe('easysmart/+/discovery', (err) => {
    if (err) logger.error({ err }, 'Erro ao inscrever discovery');
  });

  client.on('message', async (topic, payload) => {
    try {
      const msg = payload.toString();
      if (topic.endsWith('/discovery')) {
        const deviceId = topic.split('/')[1];
        const data = JSON.parse(msg);
        logger.info({ topic, deviceId }, '📡 [DISCOVERY] Recebido discovery');

        // Persistir no banco
        await registerDiscovery(data, deviceId);
      }
      else if (topic.includes('/sensor/') && topic.endsWith('/state')) {
        const data = JSON.parse(msg);
        logger.info({ topic, data }, '📈 [SENSOR] Dados recebidos');
      }
      else if (topic.includes('/switch/') && topic.endsWith('/state')) {
        const data = JSON.parse(msg);
        logger.info({ topic, data }, '💡 [SWITCH] Estado recebido');
      }
    } catch (err) {
      logger.error({ err, topic, payload: payload.toString() }, 'Erro ao processar mensagem MQTT');
    }
  });

  logger.info('✅ Serviço MQTT ativo e escutando tópicos');
}

module.exports = { initMqttService };