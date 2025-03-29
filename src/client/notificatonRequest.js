import aws from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import CONFIG_MAP from "../../config/config.js";
dotenv.config();

const awsconfig = {
  ID: process.env.ID || CONFIG_MAP.AWS_SQS_ACCESSKEYID,
  SECRET: process.env.SECRET || CONFIG_MAP.AWS_SQS_SECRETACCESSKEY,
  REGION:
    process.env.NOTIFICATIONREGION || CONFIG_MAP.AWS_NOTIFICATION_SQL_REGION,
  NotificationQueue:
    process.env.NOTIFICATIONQUEUE || CONFIG_MAP.AWS_NOTIFICATION_SQL_URL,
};
aws.config = {
  accessKeyId: awsconfig.ID,
  secretAccessKey: awsconfig.SECRET,
  region: awsconfig.REGION,
};
const SQS = new aws.SQS();
const enQueue = (QueueURL, message, delayTime = 0) => {
  console.log("notificationRequest/enQueue : Start");

  SQS.sendMessage(
    {
      MessageBody: JSON.stringify(message),
      // MessageGroupId: uuidv4(), //unique
      // MessageDeduplicationId: uuidv4(), //unique may be same as above
      QueueUrl: QueueURL,
      DelaySeconds: delayTime,
    },
    (err, result) => {
      if (err) {
        console.log("notificationRequest/enQueue : Error", err);
      } else {
        console.log("notificationRequest/enQueue : Result : ", result);
      }
      console.log("notificationRequest/enQueue : End");
    }
  );
};

export const sendMailRequest = (
  sender_address,
  to_address,
  cc_address,
  bcc_address,
  subject,
  body
) => {
  console.log("notificationRequest/sendMailRequest : Start");
  try {
    const message = {
      notification_type: "EMAIL",
      email_data: {
        sender_address: sender_address,
        receiver_address: {
          to_address: to_address,
          Cc_address: cc_address ? cc_address : "",
          Bcc_address: bcc_address ? bcc_address : "",
        },
        subject: subject,
        body: body,
      },
    };
    const QueueURL = awsconfig.NotificationQueue;
    enQueue(QueueURL, message);
    console.log("notificationRequest/sendMailRequest : Enqueue Successful");
    console.log("notificationRequest/sendMailRequest : End");
    return true;
  } catch (err) {
    console.log("notificationRequest/sendMailRequest : Error:", err);
    console.log("notificationRequest/sendMailRequest : End");

    return false;
  }
};
export const sendSmsRequest = (sender, receiver, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("notificationRequest/sendSmsRequest : Start");

      const message = {
        notification_type: "SMS",
        sms_data: {
          sender: sender,
          receiver: receiver,
          body: body,
        },
      };
      const QueueURL = awsconfig.NotificationQueue;
      enQueue(QueueURL, message);
      console.log("notificationRequest/sendSmsRequest : Enqueue Successful");
      console.log("notificationRequest/sendSmsRequest : End");
      resolve("done once");
    } catch (err) {
      reject(err);
    }
  });
};
