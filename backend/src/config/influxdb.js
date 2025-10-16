const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const logger = require('./logger');

// Cliente InfluxDB
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

const org = process.env.INFLUXDB_ORG;
const bucket = process.env.INFLUXDB_BUCKET;

// Write API (para inserir dados)
const writeApi = influxDB.getWriteApi(org, bucket, 'ms');
writeApi.useDefaultTags({ app: 'easysmart-backend' });

// Query API (para consultar dados)
const queryApi = influxDB.getQueryApi(org);

/**
 * Testa conexão com InfluxDB
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -1m)
        |> limit(n: 1)
    `;
    
    // Tenta executar uma query simples
    await queryApi.collectRows(query);
    
    logger.info({
      url: process.env.INFLUXDB_URL,
      org,
      bucket
    }, 'InfluxDB conectado com sucesso');
    
    return true;
  } catch (err) {
    logger.error({ err }, 'Falha ao conectar no InfluxDB');
    throw err;
  }
}

/**
 * Escreve um ponto de dados no InfluxDB
 * @param {string} measurement - Nome da measurement (ex: 'temperature')
 * @param {Object} tags - Tags para indexação (ex: { deviceId, entity })
 * @param {Object} fields - Campos com valores (ex: { value: 23.5 })
 * @param {Date} timestamp - Timestamp do dado (opcional, default: now)
 */
async function writePoint(measurement, tags, fields, timestamp = null) {
  try {
    const point = new Point(measurement);
    
    // Adiciona tags
    Object.entries(tags).forEach(([key, value]) => {
      point.tag(key, String(value));
    });
    
    // Adiciona fields
    Object.entries(fields).forEach(([key, value]) => {
      if (typeof value === 'number') {
        point.floatField(key, value);
      } else if (typeof value === 'boolean') {
        point.booleanField(key, value);
      } else {
        point.stringField(key, String(value));
      }
    });
    
    // Adiciona timestamp se fornecido
    if (timestamp) {
      point.timestamp(timestamp);
    }
    
    writeApi.writePoint(point);
    
    logger.debug({
      measurement,
      tags,
      fields
    }, 'Ponto escrito no InfluxDB');
    
    return true;
  } catch (err) {
    logger.error({ err, measurement, tags, fields }, 'Erro ao escrever ponto no InfluxDB');
    throw err;
  }
}

/**
 * Força flush dos dados pendentes
 * Importante: sempre chamar antes de encerrar a aplicação
 */
async function flush() {
  try {
    await writeApi.flush();
    logger.debug('Flush InfluxDB concluído');
  } catch (err) {
    logger.error({ err }, 'Erro ao fazer flush InfluxDB');
    throw err;
  }
}

/**
 * Executa query no InfluxDB usando Flux
 * @param {string} fluxQuery - Query em linguagem Flux
 * @returns {Promise<Array>}
 */
async function query(fluxQuery) {
  try {
    const rows = [];
    await queryApi.collectRows(fluxQuery).then(data => {
      data.forEach(row => rows.push(row));
    });
    
    logger.debug({
      query: fluxQuery.substring(0, 100) + '...',
      rowCount: rows.length
    }, 'Query InfluxDB executada');
    
    return rows;
  } catch (err) {
    logger.error({ err, query: fluxQuery }, 'Erro ao executar query InfluxDB');
    throw err;
  }
}

/**
 * Fecha conexões do InfluxDB (shutdown graceful)
 */
async function close() {
  try {
    await writeApi.close();
    logger.info('InfluxDB fechado');
  } catch (err) {
    logger.error({ err }, 'Erro ao fechar InfluxDB');
    throw err;
  }
}

module.exports = {
  influxDB,
  writeApi,
  queryApi,
  testConnection,
  writePoint,
  flush,
  query,
  close
};
