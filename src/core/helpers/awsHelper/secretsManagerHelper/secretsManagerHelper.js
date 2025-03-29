// Load the AWS SDK
let AWS = require('aws-sdk');
// const config = require(`../../configHelper/configHelper`);
const dotenv = require('dotenv');
dotenv.config();
const ConfigService = require('@nestjs/config').ConfigService;
const config = new ConfigService();
// const logger = require(`../../logHelper/logHelper`);

const awsCreds = {
  region: config.get(`AWS_SECRETS_MANAGER_REGION`),
  accessKeyId: config.get(`AWS_SECRETS_MANAGER_ACCESSKEYID`),
  secretAccessKey: config.get(`AWS_SECRETS_MANAGER_SECRETACCESSKEY`),
};

/*
 * secretsmanager.getSecretValue() returns data in following format:
 * result =
 *    {ARN: "arn:aws:secretsmanager:us-west-2:123456789012:secret:MyTestDatabaseSecret-a1b2c3",
 *    CreatedDate: <Date Representation>,
 *    Name: "MyTestDatabaseSecret",
 *    SecretString: "{\n  \"username\":\"david\",\n  \"password\":\"BnQw&XDWgaEeT9XGTT29\"\n}\n",
 *    VersionId: "EXAMPLE1-90ab-cdef-fedc-ba987SECRET1",
 *    VersionStages:
 *        "AWSPREVIOUS"
 *    ]}
 */

// Create a Secrets Manager client
const secretsmanager = new AWS.SecretsManager(awsCreds);

// Function to fetch the value from the SecretsManager.
// VersionId is an optional field.
const getValue = (ctxId = ``, secretName, keys = [], versionId) => {
  // if input param `keys` isn't an array, wrap the value in a new array.

  if (!(keys instanceof Array)) {
    keys = [keys];
  }

  return new Promise(async (resolve, reject) => {
    const params = {
      SecretId: secretName,
      VersionId: versionId,
    };
    secretsmanager.getSecretValue(params, (err, result) => {
      try {
        if (err) {
          return reject(err);
        }

        let response = {};
        const data = JSON.parse(result.SecretString);

        // If no key-filter is passed, then return all the keys
        // else filter out the required keys to prepare the response.
        if (keys.length == 0) {
          response = { ...data };
        } else {
          for (const key of keys) {
            if (data[key] != undefined) {
              response[key] = data[key];
            }
          }
        }

        // logger.info(
        console.log(
          `SECRET[${secretName}]; FETCHED FROM AWS:SECRETS_MANAGER SUCCESSFULLY.`,
          ctxId,
        );

        return resolve(response);
      } catch (error) {
        // logger.error(
        console.log(
          `SECRET[${secretName}]; FAILED TO FETCH FROM AWS:SECRETS_MANAGER. Error[${error.message}]`,
          ctxId,
        );
        return reject(error);
      }
    });
  });
};

module.exports = { getValue };
