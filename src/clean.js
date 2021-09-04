const log = require('@vladmandic/pilogger');
const rimraf = require('rimraf');

function clean(config) {
  log.info('Clean:', config.locations);
  for (const loc of config.locations) rimraf.sync(loc);
}

exports.start = clean;
