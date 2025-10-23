'use strict';

const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const logger = require('../config/logger');

/**
 * Implementação compatível com mqttService:
 * - createPoint(data)
 * - enqueue(point)              -> escreve imediatamente (sem fila)
 * - startWriter() / stopWriter  -> no-ops (logam modo imediato)
 * - getLatest(deviceId, entityId)
 * - getSeries(params)
 * - getMetrics()
 * - cacheDevice(mqttId, uuid)   -> cache em memória
 * - getDeviceFromCache(mqttId)
 * - close()
 */
class InfluxService {
  constructor() {
    const url = process.env.INFLUXDB_URL;
    const token = process.env.INFLUXDB_TOKEN;
    if (!url || !token) {
      throw new Error('INFLUXDB_URL/INFLUXDB_TOKEN ausentes no ambiente');
    }

    this.client = new InfluxDB({ url, token });
    this.org = process.env.INFLUXDB_ORG;
    this.bucket = process.env.INFLUXDB_BUCKET;

    // Precisão em ms para combinar com o resto do backend
    this.writeApi = this.client.getWriteApi(this.org, this.bucket, 'ms');
    this.queryApi = this.client.getQueryApi(this.org);

    // Cache mqttId -> deviceUuid
    this.deviceCache = new Map();

    // Métricas simples
    this.metrics = {
      mode: 'immediate',       // sem fila
      pointsWritten: 0,
      pointsDropped: 0,
      writeErrors: 0,
      lastWriteTime: null,
      lastWriteStatus: 'idle',
      queueSize: 0,
      cacheSize: 0,
    };
  }

  /** Modo imediato: apenas loga para compatibilidade */
  startWriter() {
    logger.info('💾 Iniciando Influx Writer (modo automático)');
    logger.info('💾 InfluxService usando modo de escrita imediata (auto-flush).');
  }
  stopWriter() {
    // no-op
  }

  /** Compat: "enqueue" escreve imediatamente */
  enqueue(point) {
    try {
      this.writeApi.writePoint(point);
      this.metrics.pointsWritten += 1;
      this.metrics.lastWriteTime = new Date();
      this.metrics.lastWriteStatus = 'ok';
    } catch (err) {
      this.metrics.writeErrors += 1;
      this.metrics.lastWriteStatus = 'error';
      logger.error({ err }, 'Erro ao escrever ponto no InfluxDB');
    }
  }

  /** Cria Point padronizado */
  createPoint(data) {
    const {
      deviceUuid,
      mqttId,
      entityId,
      entityType,
      deviceClass,
      unit,
      value,
      valueType,        // 'float' | 'bool' | 'string'
      tenantId = null,
      timestamp = null,
    } = data;

    const point = new Point('telemetry')
      .tag('device_uuid', deviceUuid)
      .tag('mqtt_id', mqttId)
      .tag('entity_id', entityId)
      .tag('entity_type', entityType);

    if (tenantId)    point.tag('tenant_id', tenantId);
    if (deviceClass) point.tag('device_class', deviceClass);
    if (unit)        point.tag('unit', unit);

    if (valueType === 'float')       point.floatField('value_float', value);
    else if (valueType === 'bool')   point.booleanField('value_bool', value);
    else                             point.stringField('value_string', String(value));

    if (timestamp)   point.timestamp(new Date(timestamp));

    return point;
  }

  /** Normaliza payload MQTT (string, number, JSON com value/unit, ON/OFF etc.) */
  normalizePayload(payload, entityType) {
    let value, valueType, unit;

    if (typeof payload === 'string') {
      const t = payload.trim();
      if (t === 'ON' || t === 'OFF') {
        value = (t === 'ON');
        valueType = 'bool';
      } else if (!isNaN(t) && t !== '') {
        value = parseFloat(t);
        valueType = 'float';
      } else {
        value = t;
        valueType = 'string';
      }
    } else if (typeof payload === 'number') {
      value = payload;
      valueType = 'float';
    } else if (typeof payload === 'boolean') {
      value = payload;
      valueType = 'bool';
    } else if (payload && typeof payload === 'object') {
      if ('value' in payload) {
        const raw = payload.value;
        if (typeof raw === 'number') { value = raw; valueType = 'float'; unit = payload.unit || null; }
        else if (typeof raw === 'boolean') { value = raw; valueType = 'bool'; }
        else { value = String(raw); valueType = 'string'; }
      } else if ('state' in payload) {
        const s = String(payload.state).trim();
        if (s === 'ON' || s === 'OFF') { value = (s === 'ON'); valueType = 'bool'; }
        else { value = s; valueType = 'string'; }
      } else {
        value = JSON.stringify(payload);
        valueType = 'string';
      }
    } else {
      value = String(payload);
      valueType = 'string';
    }

    return { value, valueType, unit };
  }

  /** Último valor de uma entidade (qualquer field) */
  async getLatest(deviceId, entityId) {
    // deviceId pode ser o UUID real OU o mqtt_id; consultamos ambas as tags
    const flux = `
      data = from(bucket: "${this.bucket}")
        |> range(start: -7d)
        |> filter(fn: (r) => r._measurement == "telemetry")
        |> filter(fn: (r) => r.entity_id == "${entityId}")
        |> filter(fn: (r) => r.device_uuid == "${deviceId}" or r.mqtt_id == "${deviceId}")

      // combina os três fields possíveis e pega o último
      union(tables: [
        data |> filter(fn:(r)=> r._field == "value_float"),
        data |> filter(fn:(r)=> r._field == "value_bool"),
        data |> filter(fn:(r)=> r._field == "value_string"),
      ])
      |> last()
    `;

    const rows = await this.queryApi.collectRows(flux);
    if (!rows || rows.length === 0) return null;

    const r = rows[0];
    return {
      deviceUuid: r.device_uuid || null,
      mqttId:     r.mqtt_id     || null,
      entityId:   r.entity_id,
      entityType: r.entity_type || null,
      value:      r._value,
      field:      r._field,
      unit:       r.unit || null,
      timestamp:  r._time,
    };
  }

  /** Série temporal agregada */
  async getSeries(params) {
    const {
      deviceUuid,     // pode ser UUID ou mqtt_id
      entityId,
      start = '-6h',
      stop = 'now()',
      window = '1m',
      aggregation = 'mean',
    } = params;

    const flux = `
      data = from(bucket: "${this.bucket}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r._measurement == "telemetry")
        |> filter(fn: (r) => r.entity_id == "${entityId}")
        |> filter(fn: (r) => r.device_uuid == "${deviceUuid}" or r.mqtt_id == "${deviceUuid}")

      union(tables: [
        data |> filter(fn:(r)=> r._field == "value_float"),
        data |> filter(fn:(r)=> r._field == "value_bool"),
        data |> filter(fn:(r)=> r._field == "value_string"),
      ])
      |> aggregateWindow(every: ${window}, fn: ${aggregation}, createEmpty: false)
      |> yield(name: "result")
    `;

    const rows = await this.queryApi.collectRows(flux);
    return rows.map(r => ({
      timestamp: r._time,
      value: r._value,
      field: r._field,
    }));
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.deviceCache.size,
      queueSize: 0, // modo imediato
      mode: 'immediate',
    };
  }

  cacheDevice(mqttId, deviceUuid) {
    this.deviceCache.set(mqttId, deviceUuid);
    this.metrics.cacheSize = this.deviceCache.size;
  }
  getDeviceFromCache(mqttId) {
    return this.deviceCache.get(mqttId);
  }

  async close() {
    try {
      await this.writeApi.flush();
    } catch (e) {}
    await this.writeApi.close();
    logger.info('InfluxService fechado (writeApi.close).');
  }
}

const influxService = new InfluxService();
module.exports = influxService;
