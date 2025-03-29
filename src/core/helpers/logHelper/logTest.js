import * as logger from "./logHelper.js";
import { v4 as uuidv4 } from "uuid";

const ctx = uuidv4();
const testValueObj1 = {
  name: `Raj`,
  obj: {
    key: `value`,
  },
};

logger.info(`I AM INFO LOG WITH ContextId`, ctx);
logger.info(`I AM INFO LOG WITHOUT ContextID`);
logger.error(`I AM ERROR LOG`, ctx);
logger.debug(`I AM DEBUG LOG`, ctx);
logger.warn(`I AM WARN LOG`, ctx);
