// Function to generate a random ID (Alpha-Numeric) of length as passed in the param.
const createRandomId = (ctxId, length) => {
  return new Promise(async (resolve, reject) => {
    try {
      // create a random alpha-numeric key of length as passed in params
      let key = "";
      while (key.length < length - 1) {
        key += Math.random().toString(36).substr(2, 1);
      }
      const id = key.toUpperCase();
      resolve(id);
    } catch (error) {
      console.error(error, ctxId);
      reject(error);
    }
  });
};

// Function to generate a random Number of length as passed in the param.
const createRandomNumber = (ctxId, length) => {
  return new Promise(async (resolve, reject) => {
    try {
      // create a random number of length as passed in params
      let randomNumber = Math.floor(10**(length-1) + Math.random() * (9*(10**(length-1))));
      resolve(randomNumber);
    } catch (error) {
      console.error(error, ctxId);
      reject(error);
    }
  });
};

const createErrorObject = (ctxId, errMessage, errorCode, errorStatusCode) => {
  return new Promise((resolve, reject) => {
    const responseObj = new Error(errMessage);
    responseObj.code = errorCode;
    responseObj.statusCode = errorStatusCode || 500;
    responseObj.stack = undefined;

    resolve(responseObj);
  });
};

// Function to mask critical details (email id, bank account details, etc) while sending transaction related emails or SMSs.
// it will mask everything except last n characters (n = value of `length` parameter)
const maskCriticalValue = (ctxId, value, length = 4, direction = "start") => {
  return new Promise(async (resolve, reject) => {
    let maskedValue;

    switch (direction) {
      case "start":
        maskedValue = await maskCriticalValueFromStart(ctxId, value, length);
        break;

      case "end":
        maskedValue = await maskCriticalValueFromEnd(ctxId, value, length);
        break;
    }
    resolve(maskedValue);
  });
};

const maskCriticalValueFromStart = (ctxId, value, length = 4) => {
  return new Promise((resolve, reject) => {
    const regex = `(?<=^.{0,${length}}).`;
    const regexExp = new RegExp(regex, "g");
    const maskedValue = value.replace(regexExp, "*");
    resolve(maskedValue);
  });
};

const maskCriticalValueFromEnd = (ctxId, value, length = 4) => {
  return new Promise((resolve, reject) => {
    const regex = `.(?=.{${length}})`;
    const regexExp = new RegExp(regex, "g");
    const maskedValue = value.replace(regexExp, "*");
    resolve(maskedValue);
  });
};

const maskEmail = (email) => new Promise((resolve, reject) => {
  if(email){
    let [user_name, domain_name] = email.split('@');
    let [host_name, ...top_level_domain] = domain_name.split('.');
    let masked_user_name = "";
    let masked_host_name = "";
    if (user_name.length > 1) {
      masked_user_name = email.substr(0, 1) + new Array(user_name.length - 1).fill('*').join('');
    } else {
      masked_user_name = user_name;
    }
    if (host_name.length > 1) {
      masked_host_name = host_name.substr(0, 1) + new Array(host_name.length - 1).fill('*').join('');
    } else {
      masked_host_name = host_name;
    }
    const maskedValue = `${masked_user_name}@${masked_host_name}.${top_level_domain.join('.')}`;
    resolve(maskedValue);
  }else{
    resolve(email);
  }
  
});

const maskPhoneNumber = (phone_no) => new Promise((resolve, reject) => {
  if(phone_no){
    if (phone_no.length > 4) {
      phone_no = phone_no.substr(-4)
    } else {
      phone_no = phone_no;
    }
  }
  resolve(phone_no);
});




export {
  createRandomId,
  createRandomNumber,
  createErrorObject,
  maskCriticalValue,
  maskCriticalValueFromStart,
  maskCriticalValueFromEnd,
  maskEmail,
  maskPhoneNumber
};
