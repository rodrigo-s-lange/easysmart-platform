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
let client = null;
let isConnected = false;

/**
 * Inicializa o cliente MQTT e retorna a instância conectada.
 */
async function initMqtt() {
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
        resolve(client); // <- resolve só depois de realmente conectar
      });

      client.on('error', (err) => {
        isConnected = false;
        logger.error({ err }, '❌ Erro MQTT');
      });

      client.on('reconnect', () => logger.warn('♻️ Reconnectando ao broker MQTT...'));
      client.on('close', () => {
        isConnected = false;
        logger.warn('⚠️ Conexão MQTT encerrada');
      });
      client.on('offline', () => {
        isConnected = false;
        logger.warn('📡 Broker MQTT offline');
      });

      // Timeout de segurança
      setTimeout(() => {
        if (!isConnected) {
          logger.warn('⏰ Timeout ao conectar ao MQTT');
          resolve(null);
        }
      }, 5000);
    } catch (err) {
      logger.error({ err }, 'Erro fatal ao inicializar MQTT');
      reject(err);
    }
  });
}

/**
 * Retorna se está conectado.
 */
function isMqttConnected() {
  return isConnected;
}

/**
 * Retorna a instância ativa do cliente MQTT.
 */
function getClient() {
  return client;
}

module.exports = {
  initMqtt,
  isMqttConnected,
  getClient,
};