import * as chokidar from 'chokidar';
import * as log from '@vladmandic/pilogger';
import * as compile from './compile.js';

const minElapsed = 2000;
let lastBuilt = Date.now();

async function build(evt, msg, options, steps) {
  const now = Date.now();
  if ((now - lastBuilt) > minElapsed) {
    log.info('Watch:', { event: msg, input: evt });
    compile.run(options, steps);
  } else {
    log.info('Watch:', { event: msg, input: evt, skip: true });
  }
  lastBuilt = now;
}

// watch filesystem for any changes and notify build when needed
export async function start(options, steps) {
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
      .on('add', (evt) => build(evt, 'add', options, steps))
      .on('change', (evt) => build(evt, 'modify', options, steps))
      .on('unlink', (evt) => build(evt, 'remove', options, steps))
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
