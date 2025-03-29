// -----------------------------------------------------------------------------------------
// Redis Connection - it will re-try until success or defined limit exceeded
// Ref Link:
// a. https://stackoverflow.com/questions/9940873/node-js-redis-client-connection-retry
// b. https://stackoverflow.com/a/60282230
// -----------------------------------------------------------------------------------------

const redis = require(`redis`);
// const config = require(`../configHelper/configHelper`);
const ConfigService = require('@nestjs/config').ConfigService;
const logger = require(`../logHelper/logHelper`);
const config = new ConfigService();
const host = config.get(`REDIS_HOST`);
const port = config.get(`REDIS_PORT`);
const password = config.get(`REDIS_PASSWORD`);

const defaultTTL = config.get(`CACHE_TTL_DEFAULT`);

const options = {
  host,
  port,
  no_ready_check: true,
  auth_pass: password,
  retry_strategy: (options) => {
    const { error, total_retry_time, attempt } = options;
    if (error && error.code === 'ECONNREFUSED') {
      logger.error(`CacheHelper: REDIS CONNECTION: Error[${error.code}]`); // take actions or throw exception
    }
    if (total_retry_time > 1000 * 15) {
      // in ms i.e. 15 sec
      logger.info(
        `CacheHelper: REDIS CONNECTION: Retrying since [${total_retry_time}ms]`,
      ); // take actions or throw exception
    }
    if (options.attempt > 10) {
      logger.info(
        `CacheHelper: REDIS CONNECTION: [${options.attempt}] reconnection attempts done`,
      ); // take actions or throw exception
    }
    logger.info(
      `CacheHelper: REDIS CONNECTION: Attempting to restore connection`,
    );
    // reconnect after
    return Math.min(options.attempt * 100, 60000); //in ms
  },
};

// Declare the cache client
let cacheClient;

const init = (ctxId = ``) => {
  logger.info(`CacheHelper: REDIS CREATE CONNECTION OPERATION INVOKED`, ctxId);

  // connect to a single node of REDIS
  cacheClient = redis.createClient(options);

  // TBD: Add support to connect to multiple redis hosts (redis-cluster)
  // Ref: https://www.npmjs.com/package/redis-clustr

  cacheClient.on('connect', () => {
    logger.info('CacheHelper: REDIS CONNECTION ESTABLISHED.', ctxId);
  });

  cacheClient.on('error', (error) => {
    logger.error(
      `CacheHelper: REDIS CONNECTION ERROR[${JSON.stringify(error)}]`,
      ctxId,
    );
  });

  cacheClient.on('reconnecting', (error) => {
    logger.info(
      `CacheHelper: REDIS ATTEMPTING TO RE-CONNECT; ERROR[${JSON.stringify(
        error,
      )}]`,
      ctxId,
    );
  });

  cacheClient.on('end', (error) => {
    logger.info(
      `CacheHelper: REDIS CONNECTION CLOSED. ERROR[${JSON.stringify(error)}]`,
      ctxId,
    );
  });
};

// -----------------------------
// Define Cache GET/SET methods
// -----------------------------

// REDIS: Fetch value of an existing key in Redis
const get = (ctxId = ``, key) => {
  return new Promise((resolve, reject) => {
    cacheClient.get(key, (error, result) => {
      if (error) {
        const errMsg = `REDIS GET operation failed; ERROR[${JSON.stringify(
          error,
        )}]`;
        logger.error(errMsg, ctxId);
        const newError = new Error(errMsg);
        return reject(newError);
      }
      return resolve(result);
    });
  });
};

// REDIS: Fetch TTL value of an existing key in Redis
const getTtl = (ctxId = ``, key) => {
  return new Promise((resolve, reject) => {
    // cacheClient.multi().ttl(key, (error, result) => {
    cacheClient
      .multi()
      .ttl(key)
      .exec((error, result) => {
        if (error) {
          const errMsg = `REDIS GET TTL operation failed; ERROR[${JSON.stringify(
            error,
          )}]`;
          logger.error(errMsg, ctxId);
          const newError = new Error(errMsg);
          return reject(newError);
        }
        return resolve(result);
      });
  });
};

// REDIS: Set a new key-value
const set = (ctxId = ``, key, body, expireInSeconds = defaultTTL) => {
  return new Promise((resolve, reject) => {
    if (expireInSeconds != undefined) {
      cacheClient.set(key, body, 'EX', expireInSeconds, (error, result) => {
        if (error) {
          const errMsg = `REDIS SET operation failed; ERROR[${JSON.stringify(
            error,
          )}]`;
          logger.error(errMsg, ctxId);
          const newError = new Error(errMsg);
          return reject(newError);
        }
        return resolve(result);
      });
    }
  });
};

// REDIS: Clear an existing key-value
const clear = (ctxId = ``, key) => {
  return new Promise((resolve, reject) => {
    cacheClient.del(key, (error, result) => {
      if (error) {
        const errMsg = `REDIS CLEAR operation failed; ERROR[${JSON.stringify(
          error,
        )}]`;
        logger.error(errMsg, ctxId);
        const newError = new Error(errMsg);
        return reject(newError);
      }
      return resolve(result);
    });
  });
};

// REDIS: Close an existing connection
const close = (ctxId = ``) => {
  return new Promise((resolve) => {
    try {
      logger.info(`CacheHelper: REDIS CLOSE CONNECTION OPERATION INVOKED`);
      cacheClient.quit();
      return resolve();
    } catch (error) {
      const errMsg = `REDIS CLOSE CONNECTION OPERATION failed; ERROR[${JSON.stringify(
        error,
      )}]`;
      logger.error(errMsg, ctxId);
      const newError = new Error(errMsg);
      return reject(newError);
    }
  });
};

// REDIS: Fetch value of an existing key in Redis where key is an object
const hmget = (ctxId = ``, key) => {
  return new Promise((resolve, reject) => {
    cacheClient.hmget(key, (error, result) => {
      if (error) {
        const errMsg = `REDIS HMGET operation failed; ERROR[${JSON.stringify(
          error,
        )}]`;
        logger.error(errMsg, ctxId);
        const newError = new Error(errMsg);
        return reject(newError);
      }
      return resolve(result);
    });
  });
};

// REDIS: Set a new key-value where key is an object
const hmset = (ctxId = ``, key, body) => {
  return new Promise((resolve, reject) => {
    cacheClient.hmset(key, body, (error, result) => {
      if (error) {
        const errMsg = `REDIS HMSET operation failed; ERROR[${JSON.stringify(
          error,
        )}]`;
        logger.error(errMsg, ctxId);
        const newError = new Error(errMsg);
        return reject(newError);
      }
      return resolve(result);
    });
  });
};

module.exports = { init, get, set, clear, close, hmget, hmset, getTtl };
