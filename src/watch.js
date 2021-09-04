const chokidar = require('chokidar');
const log = require('@vladmandic/pilogger');
const build = require('./build.js');

const minElapsed = 2;
let lastBuilt = Date.now();

async function buildAll(evt, msg) {
  const now = Date.now();
  log.info('Watch:', msg, evt);
  if ((now - lastBuilt) > minElapsed) build.build(evt, true);
  else log.state('Build: merge event file', msg, evt);
  lastBuilt = now;
}

// watch filesystem for any changes and notify build when needed
async function watch(options) {
  const watcher = chokidar.watch(options.locations, {
    persistent: true,
    ignorePermissionErrors: false,
    alwaysStat: false,
    ignoreInitial: true,
    followSymlinks: true,
    usePolling: false,
    useFsEvents: false,
    atomic: true,
  });
  // single event handler for file add/change/delete
  watcher
    .on('add', (evt) => buildAll(evt, 'add'))
    .on('change', (evt) => buildAll(evt, 'modify'))
    .on('unlink', (evt) => buildAll(evt, 'remove'))
    .on('error', (err) => log.error(`Client watcher error: ${err}`))
    .on('ready', () => log.state('Watching:', options.locations));
}

exports.start = watch;
