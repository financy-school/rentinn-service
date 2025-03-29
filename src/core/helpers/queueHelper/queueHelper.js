const Producer = require("sqs-producer");
const config = require(`../configHelper/configHelper`);

const awsCreds = {
  region: config.getValue(`AWS_SQS_REGION`),
  //accessKeyId: config.getValue(`AWS_SQS_ACCESS_KEY`),
  //secretAccessKey: config.getValue(`AWS_SQS_SECRET_ACCESS_KEY`),
};

const enqueue = (ctxId, queueUrl, body, delaySeconds = 0) => {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(26).slice(6); // 8 characters
    const producer = Producer.create({
      queueUrl,
      region: awsCreds.region,
      //accessKeyId: awsCreds.accessKeyId,
      //secretAccessKey: awsCreds.secretAccessKey,
    });

    // Handle the case when body is undefined.
    body = body == undefined ? {} : body;

    producer.send([{ id, body, delaySeconds }], (error) => {
      if (error) {
        const newErr = new Error(
          `FAILED to ENQUEUE; QueueUrl[${queueUrl}]; Message[${body}]; Error[${error.message}]`
        );
        reject(newErr);
      } else {
        resolve(`Enqueue Successful!!`);
      }
    });
  });
};

export { enqueue };
