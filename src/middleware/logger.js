const expressWinston = require('express-winston');
const winston = require('winston');

const loggerMiddleware = expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  meta: true,
  expressFormat: true,
  colorize: true
});

module.exports = loggerMiddleware;
