const config = require("../configHelper/configHelper.js");

const fs = require("fs");
const path = require("path");
const winston = require("winston");
const moment = require("moment");
// const SplunkStreamEvent = require("winston-splunk-httplogger");

const level = config.getValue("LOG_LEVEL");
const service = config.getValue("SERVICE_NAME");
const logDirectory = config.getValue("LOG_DIRECTORY_LOCATION");
const gmtLogging = config.getValue("LOG_IN_GMT_TIMESTAMP");
const splunkLoggingEnabled = config.getValue("SPLUNK_LOGGING_ENABLED");

const logFile = logDirectory + `${service}.log`;
const logErrorFile = logDirectory + `${service}-error.log`;

// Declare the logger
let logger;

const customTimeStamp = () => {
  if (gmtLogging.toLowerCase() == `false`) {
    return moment().format("YYYY-MM-DD HH:mm:ss.SSS Z"); // 2020-03-15 16:56:11.868 +08:00
  } else {
    return moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS Z"); // 2020-03-15 08:55:58.596 +00:00
  }
  // some other formats:
  // return moment().utc().utcOffset("+0800").format(); // 2020-03-15T16:55:33+08:00
  // return moment().utc().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss.SSS Z"); // 2020-03-15 16:55:43.767 +08:00
};

// Log Format Options (Add Timestamp. Make it JSON.)
const format = winston.format.combine(
  winston.format.timestamp({
    format: customTimeStamp,
  }),
  winston.format.json()
);

// define the custom settings for each winston-output-plugin/transport (file, console)
const options = {
  combinedFile: {
    level,
    format,
    filename: logFile,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  errorFile: {
    level: `error`,
    format,
    filename: logErrorFile,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level,
    format,
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

let winstonOutputPlugins = [
  // - Write all logs with level `error` and below to `error.log`
  new winston.transports.File(options.errorFile),

  // - Write all logs with level `info` and below to `combined.log`
  new winston.transports.File(options.combinedFile),

  // - Write all logs to `console` as well
  new winston.transports.Console(options.console),
];

// If splunk logging is enabled, add splunk output plugin to winston
// if (splunkLoggingEnabled.toLowerCase() == `true`) {
//   // Splunk Related Configuration
//   const splunkSettings = {
//     token: config.getValue("SPLUNK_TOKEN"),
//     index: `main`,
//     host: config.getValue("SPLUNK_HOST"),
//     index: `raj-index`,
//     source: config.getValue("SERVICE_NAME"),
//     sourceType: `pid:${global.process.pid}`,
//     maxRetries: 2,
//   };

//   const splunkGlobalSettings = {
//     splunk: splunkSettings,
//     batchInterval: 5000,
//     maxBatchCount: 20,
//   };

//   const newStreamEvent = new SplunkStreamEvent(splunkGlobalSettings);

//   winstonOutputPlugins.push(newStreamEvent); // - Ship all logs to `splunk`
// }

// instantiate a new Winston Logger with the custom settings.
logger = winston.createLogger({
  level,
  format,
  defaultMeta: {
    service,
    pid: global.process.pid,
  },
  transports: winstonOutputPlugins,
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a `write` function that will be used by `morgan`
logger.stream = {
  write: function (message, encoding) {
    // use the `info` log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

// Custom `info` wrapper on top of logger.info
const info = (message, ctxId) => {
  // message = (typeof message === 'object' && message !== null) ? JSON.stringify(message): message; // Not Required, winston handles printing the obj.
  const msg = {
    ctxId,
    body: message,
  };
  logger.info(msg);
};

// Custom `debug` wrapper on top of logger.debug
const debug = (message, ctxId) => {
  const msg = {
    ctxId,
    body: message,
  };
  logger.debug(msg);
};

// Custom `error` wrapper on top of logger.error
const error = (message, ctxId) => {
  const msg = {
    ctxId,
    body: message,
  };
  logger.error(msg);
};

// Custom `warn` wrapper on top of logger.warn
const warn = (message, ctxId) => {
  const msg = {
    ctxId,
    body: message,
  };
  logger.warn(msg);
};

// Export all the required methods
module.exports = {
  logger, // this is the original winston logger without any custom wrapper.
  info,
  debug,
  error,
  warn,
};
