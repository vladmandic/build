const log = require('@vladmandic/pilogger');
const rimraf = require('rimraf');

function clean(config) {
  log.state('Clean:', { locations: config.locations });
  for (const loc of config.locations) rimraf.sync(loc);
}

exports.start = clean;
