const axios = require("axios");

const sendGetRequest = (ctxId, url, headers, successCode = 200) => {
  return new Promise(async (resolve, reject) => {
    // Make a GET request
    try {
      const response = await axios.get(url, { headers });

      if (response.status == successCode) {
        resolve(response.data);
      } else {
        const errMsg = `Got NON-200 Response. URL[${url}];`;
        reject(errMsg);
      }
    } catch (error) {
      const errMsg = new Error(
        `Failed to call URL[${url}]; ERROR[${error.message}]`
      );
      reject(errMsg);
    }
  });
};

const sendPostRequest = (
  ctxId,
  url,
  headers,
  requestBody,
  successCode = 200
) => {
  return new Promise(async (resolve, reject) => {
    // Make a POST request
    try {
      const response = await axios.post(url, requestBody, { headers });

      if (response.status == successCode) {
        resolve(response.data);
      } else {
        const errMsg = `Got NON-200 Response. URL[${url}]; RequestBody[${requestBody}]`;
        reject(errMsg);
      }
    } catch (error) {
      const errMsg = new Error(
        `Failed to call URL[${url}]; ERROR[${error.message}]`
      );
      reject(errMsg);
    }
  });
};

const sendPatchRequest = (
  ctxId,
  url,
  headers,
  requestBody,
  successCode = 200
) => {
  return new Promise(async (resolve, reject) => {
    // Make a PATCH request
    try {
      const response = await axios.patch(url, requestBody, { headers });

      if (response.status == successCode) {
        resolve(response.data);
      } else {
        const errMsg = `Got NON-200 Response. URL[${url}]; RequestBody[${requestBody}]`;
        reject(errMsg);
      }
    } catch (error) {
      const errMsg = new Error(
        `Failed to call URL[${url}]; ERROR[${error.message}]`
      );
      reject(errMsg);
    }
  });
};

const sendPutRequest = (
  ctxId,
  url,
  headers,
  requestBody,
  successCode = 200
) => {
  return new Promise(async (resolve, reject) => {
    // Make a PUT request
    try {
      const response = await axios.put(url, requestBody, { headers });

      if (response.status == successCode) {
        resolve(response.data);
      } else {
        const errMsg = `Got NON-200 Response. URL[${url}]; RequestBody[${requestBody}]`;
        reject(errMsg);
      }
    } catch (error) {
      const errMsg = new Error(
        `Failed to call URL[${url}]; ERROR[${error.message}]`
      );
      reject(errMsg);
    }
  });
};

export { sendGetRequest, sendPostRequest, sendPatchRequest, sendPutRequest };
