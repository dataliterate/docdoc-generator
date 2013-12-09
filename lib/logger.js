var winston = require('winston')
  logger = null
  ;

var config = {
  levels: {
    silly: 0,
    verbose: 1,
    info: 2,
    status: 3,
    data: 4,
    warn: 5,
    debug: 6,
    error: 7
  },
  colors: {
    silly: 'magenta',
    verbose: 'cyan',
    info: 'green',
    status: 'green',
    data: 'grey',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
  }
};

var logger = module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      handleExceptions: true,
      colorize: true
    })
  ],
  levels: config.levels,
  colors: config.colors,
  exitOnError: false
});