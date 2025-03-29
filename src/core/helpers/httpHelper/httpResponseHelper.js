// To do: Add feature to set response headers

const createSuccessHttpResponse = (
  ctxId,
  data = [],
  httpResponseCode = 200,
  headers = {},
  arrayResponse = true
) => {
  return new Promise(async (resolve) => {
    const statusCode = data.statusCode || httpResponseCode;
    data.statusCode = undefined;
    let parentParams;

    // if the data contains `parentParams` and `data`, then include `parentParams` params in the parent response.
    if (data.parentParams !== undefined && data.data !== undefined) {
      parentParams = data.parentParams;
      data = data.data;
    }

    // if data isn't an array, make it an array
    if (arrayResponse) {
      data = data instanceof Array ? data : [data];
    }

    // create a response object
    const response = {
      ctxId,
      statusCode,
      success: true,
      ...parentParams,
      data,
    };

    resolve(response);
  });
};

const createErrorHttpResponse = (
  ctxId,
  error = {},
  httpResponseCode = 500,
  headers = {}
) => {
  return new Promise(async (resolve) => {
    // if error.message == undefined, set it to value of function-parameter: `error` itself.
    // Useful in the scenario when caller just passes a string or `err.message` field in the function-parameter: `error`.
    if (error.message == undefined) {
      error.message = error;
    }

    // create a response object
    const response = {
      ...error,
      message: {
        ctxId,
        success: false,
        // message: error.message,
        desc: error.message,
      },
      statusCode: error.statusCode || httpResponseCode,
    };

    // response.code = error.message;

    resolve(response);
  });
};

export { createSuccessHttpResponse, createErrorHttpResponse };
