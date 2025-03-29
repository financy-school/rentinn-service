const cacheHelper = require(`./cacheHelper`);
const logger = require(`../logHelper/logHelper`);
const uuidv4 = require(`uuid`).v4;

cacheHelper.init();

const testKey1 = `I-AM-KEY`;
const testValue1 = `I-AM-VALUE-1`;
const testValue2 = `I-AM-VALUE-2`;
const testValueObj1 = {
  name: `Raj`,
  loc: {
    city: `Singapore`,
    planet: `Earth ;)`,
  },
};

const test = async () => {
  const ctxId = uuidv4();

  try {
    logger.info(`GOING TO GET [${testKey1}]`, ctxId);
    let result = await cacheHelper.get(ctxId, testKey1);
    logger.info(`GOT result[${result}]`);

    logger.info(`GOING TO SET [${testKey1}:${testValue1}]`, ctxId);
    await cacheHelper.set(ctxId, testKey1, testValue1);

    logger.info(`GOING TO GET [${testKey1}]`, ctxId);
    result = await cacheHelper.get(ctxId, testKey1);
    logger.info(`GOT result[${result}]`, ctxId);

    logger.info(`GOING TO SET [${testKey1}:${testValue2}]`, ctxId);
    await cacheHelper.set(ctxId, testKey1, testValue2);

    logger.info(`GOING TO GET [${testKey1}]`, ctxId);
    result = await cacheHelper.get(ctxId, testKey1);
    logger.info(`GOT result[${result}]`, ctxId);

    logger.info(`GOING TO DELETE THE KEY [${testKey1}]`, ctxId);
    await cacheHelper.clear(ctxId, testKey1);

    logger.info(`GOING TO GET [${testKey1}]`, ctxId);
    result = await cacheHelper.get(ctxId, testKey1);
    logger.info(`GOT result[${result}]`, ctxId);

    logger.info(`GOING TO SET [${testKey1}:${testValueObj1}]`, ctxId);
    await cacheHelper.set(ctxId, testKey1, JSON.stringify(testValueObj1));

    logger.info(`GOING TO GET [${testKey1}]`, ctxId);
    result = await cacheHelper.get(ctxId, testKey1);
    logger.info(`GOT result[${JSON.parse(result)}]`, ctxId);

    logger.info(`GOING TO DELETE THE KEY [${testKey1}]`, ctxId);
    await cacheHelper.clear(ctxId, testKey1);

    logger.info(`GOING TO CLOSE`, ctxId);
    cacheHelper.close(ctxId);

    logger.info(`CACHE TEST PASSED`, ctxId);
  } catch (error) {
    logger.error(`CACHE TEST FAILED. ERROR[${error}]`, ctxId);
    cacheHelper.close(ctxId);
    process.exit(1);
  }
};

test();
