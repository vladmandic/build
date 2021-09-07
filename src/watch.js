const chokidar = require('chokidar');
const log = require('@vladmandic/pilogger');
const compile = require('./compile.js');

const minElapsed = 2000;
let lastBuilt = Date.now();

async function build(evt, msg, options) {
  const now = Date.now();
  if ((now - lastBuilt) > minElapsed) {
    log.info('Watch:', { event: msg, input: evt });
    compile.build(options, { type: 'development' });
  } else {
    log.info('Watch:', { event: msg, input: evt, skip: true });
  }
  lastBuilt = now;
}

// watch filesystem for any changes and notify build when needed
async function watch(options) {
  const watcher = chokidar.watch(options.watch.locations, {
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
  return new Promise((resolve) => {
    watcher
      .on('add', (evt) => build(evt, 'add', options))
      .on('change', (evt) => build(evt, 'modify', options))
      .on('unlink', (evt) => build(evt, 'remove', options))
      .on('error', (err) => {
        log.error(`Client watcher error: ${err}`);
        resolve(false);
      })
      .on('ready', () => {
        log.state('Watch:', { locations: options.watch.locations });
        resolve(true);
      });
  });
}

exports.start = watch;
