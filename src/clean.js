const log = require('@vladmandic/pilogger');
const rimraf = require('rimraf');

function run(config) {
  log.state('Clean:', { locations: config.clean.locations });
  if (!config.clean.locations) log.warn('Clean called, but locations are not set');
  else for (const loc of config.clean.locations) rimraf.sync(loc);
}

exports.run = run;
