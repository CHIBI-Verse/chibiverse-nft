/* eslint-disable no-underscore-dangle */

const winston = require('winston');
require('winston-daily-rotate-file');

require('events').EventEmitter.prototype._maxListeners = 0;
require('events').defaultMaxListeners = 0;

const isDevMode = process.env.IS_DEV_MODE !== 'no';

const transports = [
  new winston.transports.DailyRotateFile({
    filename: './logs/%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    handleExceptions: true,
    json: false,
    maxSize: '20m',
    maxFiles: '30d',
  }),
  new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  }),
];

const logger = winston.createLogger({
  level: isDevMode ? 'debug' : 'info',
  format: winston.format.combine(
    //  winston.format.label({ label: path.basename(process.mainModule.filename) }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      (info) =>
        `${info.timestamp} ${info.moduleName} [${info.level}]: ${info.message}`,
    ),
  ),
  transports,
});

exports.setLogger = function setLogger(moduleName) {
  return logger.child({ moduleName });
};
