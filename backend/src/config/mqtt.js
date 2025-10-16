const mqtt = require('mqtt');
const logger = require('./logger');

let client = null;
let isConnected = false;

// Opções de conexão MQTT
const mqttOptions = {
  host: process.env.MQTT_HOST,
  port: parseInt(process.env.MQTT_PORT),
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: `easysmart-backend-${Math.random().toString(16).slice(3)}`,
  clean: true,
  reconnectPeriod: 5000, // Reconecta a cada 5s se cair
  connectTimeout: 30000,
};

/**
 * Conecta ao broker MQTT
 * @returns {Promise<Object>} Cliente MQTT
 */
async function connect() {
  return new Promise((resolve, reject) => {
    const url = `mqtt://${mqttOptions.host}:${mqttOptions.port}`;
    
    logger.info({ url, clientId: mqttOptions.clientId }, 'Conectando ao MQTT...');
    
    client = mqtt.connect(url, mqttOptions);

    // Evento: Conectado
    client.on('connect', () => {
      isConnected = true;
      logger.info({
        broker: url,
        clientId: mqttOptions.clientId
      }, 'MQTT conectado com sucesso');
      resolve(client);
    });

    // Evento: Erro de conexão
    client.on('error', (err) => {
      logger.error({ err }, 'Erro MQTT');
      if (!isConnected) {
        reject(err);
      }
    });

    // Evento: Reconectando
    client.on('reconnect', () => {
      logger.warn('Reconectando ao MQTT...');
    });

    // Evento: Desconectado
    client.on('close', () => {
      isConnected = false;
      logger.warn('MQTT desconectado');
    });

    // Evento: Offline
    client.on('offline', () => {
      isConnected = false;
      logger.warn('MQTT offline');
    });
  });
}

/**
 * Publica mensagem em um tópico
 * @param {string} topic - Tópico MQTT
 * @param {string|Object} message - Mensagem (será stringified se for objeto)
 * @param {Object} options - Opções MQTT (qos, retain, etc)
 */
function publish(topic, message, options = {}) {
  if (!client || !isConnected) {
    logger.error('MQTT não está conectado');
    throw new Error('MQTT not connected');
  }

  const payload = typeof message === 'object' ? JSON.stringify(message) : message;
  
  client.publish(topic, payload, { qos: 1, ...options }, (err) => {
    if (err) {
      logger.error({ err, topic, message }, 'Erro ao publicar mensagem MQTT');
    } else {
      logger.debug({ topic, message }, 'Mensagem MQTT publicada');
    }
  });
}

/**
 * Inscreve-se em um ou mais tópicos
 * @param {string|Array} topics - Tópico(s) para se inscrever
 * @param {Function} callback - Callback para mensagens recebidas
 */
function subscribe(topics, callback) {
  if (!client || !isConnected) {
    logger.error('MQTT não está conectado');
    throw new Error('MQTT not connected');
  }

  const topicList = Array.isArray(topics) ? topics : [topics];
  
  client.subscribe(topicList, { qos: 1 }, (err) => {
    if (err) {
      logger.error({ err, topics: topicList }, 'Erro ao se inscrever em tópicos MQTT');
    } else {
      logger.info({ topics: topicList }, 'Inscrito em tópicos MQTT');
    }
  });

  // Handler para mensagens recebidas
  client.on('message', (topic, message) => {
    try {
      const payload = message.toString();
      logger.debug({ topic, payload }, 'Mensagem MQTT recebida');
      callback(topic, payload);
    } catch (err) {
      logger.error({ err, topic }, 'Erro ao processar mensagem MQTT');
    }
  });
}

/**
 * Desinscreve de tópicos
 * @param {string|Array} topics - Tópico(s) para desinscrever
 */
function unsubscribe(topics) {
  if (!client || !isConnected) {
    logger.error('MQTT não está conectado');
    return;
  }

  const topicList = Array.isArray(topics) ? topics : [topics];
  
  client.unsubscribe(topicList, (err) => {
    if (err) {
      logger.error({ err, topics: topicList }, 'Erro ao desinscrever de tópicos MQTT');
    } else {
      logger.info({ topics: topicList }, 'Desinscrito de tópicos MQTT');
    }
  });
}

/**
 * Fecha conexão MQTT (shutdown graceful)
 */
async function disconnect() {
  return new Promise((resolve) => {
    if (client) {
      client.end(false, () => {
        logger.info('MQTT desconectado');
        isConnected = false;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Retorna status da conexão
 */
function getStatus() {
  return {
    connected: isConnected,
    clientId: mqttOptions.clientId
  };
}

module.exports = {
  connect,
  publish,
  subscribe,
  unsubscribe,
  disconnect,
  getStatus
};
