'use strict';

const mqtt = require('mqtt');
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const {
  MQTT_HOST = 'localhost',
  MQTT_PORT = 1883,
  MQTT_USERNAME,
  MQTT_PASSWORD,
} = process.env;

const MQTT_URL = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
let isConnected = false;
let client;

/**
 * Inicializa o cliente MQTT com reconexão e timeout seguro.
 */
function initMqtt() {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        reconnectPeriod: 2000,
        connectTimeout: 4000,
        clean: true,
        clientId: `easysmart_backend_${Math.random().toString(16).slice(2, 10)}`,
      };

      logger.info(`🔌 Conectando ao broker MQTT em ${MQTT_URL}...`);
      client = mqtt.connect(MQTT_URL, options);

      client.on('connect', () => {
        isConnected = true;
        logger.info('✅ Conectado ao broker MQTT');
        resolve(true);
      });

      client.on('error', err => {
        isConnected = false;
        logger.error({ err }, '❌ Erro MQTT');
      });

      client.on('reconnect', () => {
        logger.warn('♻️ Reconnectando ao broker MQTT...');
      });

      client.on('close', () => {
        isConnected = false;
        logger.warn('⚠️ Conexão MQTT encerrada');
      });

      client.on('offline', () => {
        isConnected = false;
        logger.warn('📡 Broker MQTT offline');
      });

      setTimeout(() => {
        if (!isConnected) {
          logger.warn('⏰ Timeout ao conectar ao MQTT');
          resolve(false);
        }
      }, 5000);
    } catch (err) {
      logger.error({ err }, 'Erro fatal ao inicializar MQTT');
      reject(err);
    }
  });
}

/**
 * Retorna estado atual da conexão
 */
function isMqttConnected() {
  return isConnected;
}

module.exports = {
  initMqtt,
  isMqttConnected,
  publish: (topic, message, opts = {}) => {
    if (isConnected && client) {
      client.publish(topic, message, opts);
      logger.debug(`📤 MQTT → ${topic}: ${message}`);
    } else {
      logger.warn(`❌ Falha ao publicar (MQTT desconectado): ${topic}`);
    }
  },
  subscribe: (topic, handler) => {
    if (!client) return;
    client.subscribe(topic, err => {
      if (err) {
        logger.error({ err }, `❌ Erro ao inscrever em ${topic}`);
      } else {
        logger.info(`📡 Inscrito em ${topic}`);
      }
    });
    client.on('message', (t, payload) => {
      if (t === topic) handler(payload.toString());
    });
  },
};