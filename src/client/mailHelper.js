import axios from "axios";
import { sendMailRequest, sendSmsRequest } from "./notificatonRequest.js";
import dotenv from "dotenv";

const REQUESTURL = process.env.EMAIL_TEMPLATE_SERVICE_URL;

export const sendMail = async (
  template_name,
  req_body,
  sender_address,
  to_address,
  cc_address,
  bcc_address,
  subject
) => {
  console.log("mailhelper/sendMail : Start");
  const reqBody = {
    template_name: template_name,
    data: req_body,
  };
  console.log("mailhelper/sendMail : Request URL:", REQUESTURL);
  console.log("mailhelper/sendMail : Request Body:", reqBody);

  const Response = await axios.post(REQUESTURL, reqBody);
  if (Response.status == 200) {
    const body = Response.data.data.html_template;
    try {
      const success = await sendMailRequest(
        sender_address,
        to_address,
        cc_address,
        bcc_address,
        subject,
        body
      );
      if (!success) {
        console.log("mailhelper/sendMail : End");
        return false;
      }
      return true;
    } catch (err) {
      console.log("error");
      console.log("mailhelper/sendMail : End");
      return false;
    }
  }
  console.log("mailhelper/sendMail : End");
  return false;
};

export const sendSMS = async (sender, receiver, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("mailhelper/sendSMS : Start");

      sendSmsRequest(sender, receiver, body).then(
        (res) => {
          resolve(res);
        },
        (err) => {
          throw err;
        }
      );
    } catch (err) {
      console.log("mailhelper/sendSMS : Error: ", err);

      reject(err);
    }
  });
};

//sendMail("otp_v2",{"otp":14},"","dipanshubhola1009@gmail.com","","","test");

// sendSMS("","919034391333","test").then(resolve => {console.log(resolve)}, reject=>{console.log(reject)});
