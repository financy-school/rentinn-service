const dotenv = require(`dotenv`);
const envLoadedResult = dotenv.config({ path: `../../../../.env` });

const { ConfigService, ConfigModule } = require("@nestjs/config");
// ConfigModule.forFeature({})
const config = new ConfigService();
const secretManagerHelper = require(`./secretsManagerHelper`);
// const logger = require(`../../logHelper/logHelper`);
const uuidv4 = require(`uuid`).v4;

const testSecret = `SOME_CONFIG`;

const ctxId = uuidv4();

const test = async () => {
  try {
    const result = await secretManagerHelper.getValue(ctxId, testSecret, [
      `USERNAME`,
      `PASSWORD`,
    ]);
    console.log(
      `Secret[${testSecret}]; Value[${result.USERNAME}]; Value[${JSON.stringify(
        result
      )}]`,
      ctxId
    );
    // logger.info(
    //   `Secret[${testSecret}]; Value[${result.USERNAME}]; Value[${JSON.stringify(result)}]`,
    //   ctxId
    // );

    // Fetch specific version of the secret
    const versionId = `5c616e58-9a57-42a8-884f-1fb338c46393`;
    const result2 = await secretManagerHelper.getValue(
      ctxId,
      testSecret,
      [`USERNAME`, `PASSWORD`],
      versionId
    );
    console.log(
      `Secret[${testSecret}]; VersionId[${versionId}] Value[${
        result2.USERNAME
      }]; Value[${JSON.stringify(result2)}]`,
      ctxId
    );
    // logger.info(
    //   `Secret[${testSecret}]; VersionId[${versionId}] Value[${
    //     result2.USERNAME
    //   }]; Value[${JSON.stringify(result2)}]`,
    //   ctxId
    // );

    // Fetch specific version of the secret by passing a single key, instead of an Array.
    const result3 = await secretManagerHelper.getValue(
      ctxId,
      testSecret,
      `USERNAME`,
      versionId
    );
    console.log(
      `Secret[${testSecret}]; Value[${
        result3.USERNAME
      }]; Value[${JSON.stringify(result3)}]`,
      ctxId
    );
    // logger.info(
    //   `Secret[${testSecret}]; Value[${result3.USERNAME}]; Value[${JSON.stringify(result3)}]`,
    //   ctxId
    // );
  } catch (error) {
    console.error(
      `Secret[${testSecret}]; FAILED TO FETCH THE SECRET. ERROR[${error}]`,
      ctxId
    );
    // logger.error(`Secret[${testSecret}]; FAILED TO FETCH THE SECRET. ERROR[${error}]`, ctxId);
  }
};

test();
