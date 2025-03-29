// load ENVIRONMENT_VARIABLES from .env file [ONLY NEEDED IN LOCAL/DEV SYSTEMS]
const dotenv = require("dotenv");
const envLoadedResult = dotenv.config({
  path: "../../../.env",
});

const configFileName = process.env.CONFIG_FILE_PATH || "config/config.js";
const configFilePath = `../../../${configFileName}`;

// import CONFIG_MAP from configFilePath; // `import` needs static reference; So temporarily hardcoding the filepath.
// import CONFIG_MAP from "../../config/config.js";
const CONFIG_MAP = {};

const getValue = (key) => {
  if (CONFIG_MAP[key] == undefined) {
    const error = new Error(
      `CONFIG FILE[${configFileName}] doesn't contain the Key[${key}]`
    );
    throw error;
  }

  const value = CONFIG_MAP[key];
  return value;
};

const contains = (key) => {
  const response = CONFIG_MAP[key] == undefined ? false : true;
  return response;
};

module.exports = { getValue, contains };
