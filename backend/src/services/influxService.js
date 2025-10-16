const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const logger = require('../config/logger');

class InfluxService {
  constructor() {
    this.client = new InfluxDB({
      url: process.env.INFLUXDB_URL,
      token: process.env.INFLUXDB_TOKEN,
    });

    this.org = process.env.INFLUXDB_ORG;
    this.bucket = process.env.INFLUXDB_BUCKET;
    
    this.writeApi = this.client.getWriteApi(this.org, this.bucket, 'ms');
    this.queryApi = this.client.getQueryApi(this.org);

    // Buffer para batch writing
    this.queue = [];
    this.maxQueueSize = 50000; // Limite de segurança
    this.batchSize = 500; // Pontos por flush
    this.flushInterval = 500; // ms
    this.writerTimer = null;
    this.isWriting = false;

    // Cache device_uuid por mqtt_id (evita queries PostgreSQL)
    this.deviceCache = new Map();

    // Métricas
    this.metrics = {
      pointsWritten: 0,
      pointsDropped: 0,
      writeErrors: 0,
      lastWriteTime: null,
      lastWriteStatus: 'idle',
    };
  }

  /**
   * Inicia o writer (flush automático)
   */
  startWriter() {
    if (this.writerTimer) {
      logger.warn('Writer já está ativo');
      return;
    }

    this.writerTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    logger.info('📊 Influx Writer iniciado', {
      batchSize: this.batchSize,
      flushInterval: `${this.flushInterval}ms`,
    });
  }

  /**
   * Para o writer
   */
  stopWriter() {
    if (this.writerTimer) {
      clearInterval(this.writerTimer);
      this.writerTimer = null;
      logger.info('Writer parado');
    }
  }

  /**
   * Adiciona ponto à fila
   */
  enqueue(point) {
    if (this.queue.length >= this.maxQueueSize) {
      // Descarta o ponto mais antigo (política drop oldest)
      this.queue.shift();
      this.metrics.pointsDropped++;
      
      if (this.metrics.pointsDropped % 1000 === 0) {
        logger.warn('⚠️  Fila saturada, descartando pontos', {
          dropped: this.metrics.pointsDropped,
          queueSize: this.queue.length,
        });
      }
    }

    this.queue.push(point);

    // Flush imediato se batch completo
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush da fila para InfluxDB
   */
  async flush() {
    if (this.isWriting || this.queue.length === 0) {
      return;
    }

    this.isWriting = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      // Escreve batch
      for (const point of batch) {
        this.writeApi.writePoint(point);
      }

      await this.writeApi.flush();

      this.metrics.pointsWritten += batch.length;
      this.metrics.lastWriteTime = new Date();
      this.metrics.lastWriteStatus = 'ok';

      logger.debug(`💾 Batch escrito: ${batch.length} pontos`, {
        queueRemaining: this.queue.length,
        totalWritten: this.metrics.pointsWritten,
      });

    } catch (err) {
      this.metrics.writeErrors++;
      this.metrics.lastWriteStatus = 'error';

      logger.error({ err }, '❌ Erro ao escrever batch no InfluxDB');

      // Retry: recoloca pontos na fila (início)
      this.queue.unshift(...batch);

      // Limita retry para evitar loop infinito
      if (this.metrics.writeErrors > 10) {
        logger.fatal('💥 Muitos erros de escrita, descartando batch');
        this.metrics.pointsDropped += batch.length;
        this.queue.splice(0, batch.length); // Remove do retry
      }

    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Cria Point do InfluxDB
   * @param {Object} data
   * @returns {Point}
   */
  createPoint(data) {
    const {
      deviceUuid,
      mqttId,
      entityId,
      entityType,
      deviceClass,
      unit,
      value,
      valueType, // 'float' | 'bool' | 'string'
      tenantId = null,
      timestamp = null,
    } = data;

    const point = new Point('telemetry')
      .tag('device_uuid', deviceUuid)
      .tag('mqtt_id', mqttId)
      .tag('entity_id', entityId)
      .tag('entity_type', entityType);

    // Tags opcionais
    if (tenantId) point.tag('tenant_id', tenantId);
    if (deviceClass) point.tag('device_class', deviceClass);
    if (unit) point.tag('unit', unit);

    // Field baseado no tipo (evita type conflict)
    if (valueType === 'float') {
      point.floatField('value_float', value);
    } else if (valueType === 'bool') {
      point.booleanField('value_bool', value);
    } else {
      point.stringField('value_string', String(value));
    }

    // Timestamp
    if (timestamp) {
      point.timestamp(new Date(timestamp));
    }

    return point;
  }

  /**
   * Normaliza payload MQTT para Point
   * @param {Object} params
   * @returns {Object} { value, valueType, unit }
   */
  normalizePayload(payload, entityType) {
    let value, valueType, unit;

    // Payload é string (ex: "ON", "OFF", "23.5")
    if (typeof payload === 'string') {
      const trimmed = payload.trim();

      // Boolean (switch/binary_sensor)
      if (trimmed === 'ON' || trimmed === 'OFF') {
        value = trimmed === 'ON';
        valueType = 'bool';
      }
      // Tentar parse numérico
      else if (!isNaN(trimmed) && trimmed !== '') {
        value = parseFloat(trimmed);
        valueType = 'float';
      }
      // String genérica
      else {
        value = trimmed;
        valueType = 'string';
      }
    }
    // Payload é objeto JSON
    else if (typeof payload === 'object' && payload !== null) {
      // { "value": 23.5, "unit": "°C" }
      if ('value' in payload) {
        const rawValue = payload.value;

        if (typeof rawValue === 'number') {
          value = rawValue;
          valueType = 'float';
          unit = payload.unit || null;
        } else if (typeof rawValue === 'boolean') {
          value = rawValue;
          valueType = 'bool';
        } else {
          value = String(rawValue);
          valueType = 'string';
        }
      }
      // { "state": "ON" }
      else if ('state' in payload) {
        const state = String(payload.state).trim();
        if (state === 'ON' || state === 'OFF') {
          value = state === 'ON';
          valueType = 'bool';
        } else {
          value = state;
          valueType = 'string';
        }
      }
      // Objeto desconhecido
      else {
        value = JSON.stringify(payload);
        valueType = 'string';
      }
    }
    // Número direto
    else if (typeof payload === 'number') {
      value = payload;
      valueType = 'float';
    }
    // Boolean direto
    else if (typeof payload === 'boolean') {
      value = payload;
      valueType = 'bool';
    }
    // Fallback
    else {
      value = String(payload);
      valueType = 'string';
    }

    return { value, valueType, unit };
  }

  /**
   * Query: Último valor de uma entidade
   * @param {string} deviceUuid
   * @param {string} entityId
   * @returns {Promise<Object>}
   */
  async getLatest(deviceUuid, entityId) {
    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r._measurement == "telemetry")
        |> filter(fn: (r) => r.device_uuid == "${deviceUuid}")
        |> filter(fn: (r) => r.entity_id == "${entityId}")
        |> last()
    `;

    try {
      const rows = [];
      await this.queryApi.collectRows(query).then(data => {
        data.forEach(row => rows.push(row));
      });

      if (rows.length === 0) {
        return null;
      }

      // Retorna último ponto
      const row = rows[0];
      
      return {
        deviceUuid: row.device_uuid,
        entityId: row.entity_id,
        entityType: row.entity_type,
        value: row._value,
        field: row._field,
        unit: row.unit || null,
        timestamp: row._time,
      };

    } catch (err) {
      logger.error({ err, deviceUuid, entityId }, 'Erro ao query latest');
      throw err;
    }
  }

  /**
   * Query: Série temporal com agregação
   * @param {Object} params
   * @returns {Promise<Array>}
   */
  async getSeries(params) {
    const {
      deviceUuid,
      entityId,
      start = '-6h',
      stop = 'now()',
      window = '1m',
      aggregation = 'mean',
    } = params;

    const query = `
      from(bucket: "${this.bucket}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r._measurement == "telemetry")
        |> filter(fn: (r) => r.device_uuid == "${deviceUuid}")
        |> filter(fn: (r) => r.entity_id == "${entityId}")
        |> aggregateWindow(every: ${window}, fn: ${aggregation}, createEmpty: false)
        |> yield(name: "result")
    `;

    try {
      const rows = [];
      await this.queryApi.collectRows(query).then(data => {
        data.forEach(row => rows.push(row));
      });

      return rows.map(row => ({
        timestamp: row._time,
        value: row._value,
        field: row._field,
      }));

    } catch (err) {
      logger.error({ err, params }, 'Erro ao query series');
      throw err;
    }
  }

  /**
   * Retorna métricas do writer
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.queue.length,
      cacheSize: this.deviceCache.size,
    };
  }

  /**
   * Cache de device_uuid por mqtt_id
   */
  cacheDevice(mqttId, deviceUuid) {
    this.deviceCache.set(mqttId, deviceUuid);
  }

  getDeviceFromCache(mqttId) {
    return this.deviceCache.get(mqttId);
  }

  /**
   * Fecha conexão (graceful shutdown)
   */
  async close() {
    this.stopWriter();
    
    // Flush final
    if (this.queue.length > 0) {
      logger.info(`💾 Flush final: ${this.queue.length} pontos`);
      await this.flush();
    }

    await this.writeApi.close();
    logger.info('InfluxDB writer fechado');
  }
}

// Singleton
const influxService = new InfluxService();

module.exports = influxService;
