import * as AWS from 'aws-sdk';
const dotenv = require('dotenv');
//Function to fetch all fields of a Secret and store them in process.env
export async function fetchAwsSecrets(): Promise<Record<string, any>> {
  try {
    const client = new AWS.SecretsManager({
      region: process.env.AWS_SECRET_REGION,
    });
    const secret = await client
      //Enter name of Secret here.
      .getSecretValue({ SecretId: process.env.AWS_SECRET_NAME })
      .promise()
      .then((secret) => {
        const secretJson = JSON.parse(secret.SecretString);
        dotenv.config({ path: '.env' });
        Object.assign(process.env, secretJson);
        return secretJson;
      });
    return secret;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('Error connecting to AWS:', (error as any).message);
      throw new Error('Failed to connect to AWS, invalid JSON.');
    } else if ((error as any)?.code) {
      switch ((error as any)?.code) {
        case 'UnrecognizedClientException':
          console.error('Error connecting to AWS:', (error as any).message);
          throw new Error('Failed to connect to AWS, problem with credentials');
        case 'ResourceNotFoundException':
          console.error('Error connecting to AWS:', (error as any).message);
          throw new Error('Failed to connect to AWS, Secret does not exist');
        case 'NetworkingError':
          console.error('Error connecting to AWS:', (error as any).message);
          throw new Error('Failed to connect to AWS, error in network.');
        default:
          console.error('Error connecting to AWS:', (error as any).message);
          throw new Error('Failed to connect to AWS.');
      }
    } else console.error('Error connecting to AWS:', (error as any).message);
    throw new Error('Failed to connect to AWS.');
  }
}
