const log = require('@vladmandic/pilogger');
const esbuild = require('esbuild');
const build = require('./build.js');
const watch = require('./watch.js');
const serve = require('./serve.js');
const lint = require('./lint.js');
const typedoc = require('./typedoc.js');
const typings = require('./typings.js');
const helpers = require('./helpers');
const defaults = require('../config.json');
const clean = require('./clean.js');

async function main(userConfig) {
  const config = helpers.merge(defaults, userConfig || {});
  if (config.log.enabled) log.logFile(config.log.file);

  log.header();
  const toolchain = {
    esbuild: esbuild.version,
    typescript: typings.version,
    typedoc: typedoc.version,
    eslint: lint.version,
  };
  log.info('Toolchain: ', toolchain);
  if (config.watch.enabled) await watch.start(config.watch, config.build.development);
  if (config.serve.enabled) await serve.start(config.serve);
  if (config.clean.enabled) await clean.start(config.clean);
  if (config.build.enabled) await build.build(config.build, { type: 'production' });
  if (config.lint.enabled) await lint.run(config.lint);
  // await changelog.update(config.changelog); // generate changelog
  // await typings.run(targets.browserBundle.esm.entryPoints); // generate typings
  // await typedoc.run(targets.browserBundle.esm.entryPoints); // generate typedoc
}

main();
