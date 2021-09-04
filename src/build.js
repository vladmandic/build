/**
 * Implements Human build process
 * Used to generate prod builds for releases or by dev server to generate on-the-fly debug builds
 */

const log = require('@vladmandic/pilogger');
const esbuild = require('esbuild');
const changelog = require('./changelog.js');
const lint = require('./lint.js');
const typedoc = require('./typedoc.js');
const typings = require('./typings.js');
const helpers = require('./helpers');

let busy = false;

const defaults = {
  logLevel: 'error',
  bundle: true,
  banner: { js: `
  /*
  TBD
  */` },
};

async function getStats(json) {
  const stats = {};
  if (json && json.metafile?.inputs && json.metafile?.outputs) {
    for (const [key, val] of Object.entries(json.metafile.inputs)) {
      if (key.startsWith('node_modules')) {
        stats.modules = (stats.modules || 0) + 1;
        stats.moduleBytes = (stats.moduleBytes || 0) + val.bytes;
      } else {
        stats.imports = (stats.imports || 0) + 1;
        stats.importBytes = (stats.importBytes || 0) + val.bytes;
      }
    }
    const files = [];
    for (const [key, val] of Object.entries(json.metafile.outputs)) {
      if (!key.endsWith('.map')) {
        files.push(key);
        stats.outputBytes = (stats.outputBytes || 0) + val.bytes;
      }
    }
    stats.outputFiles = files.join(', ');
  }
  return stats;
}

// rebuild on file change
async function build(config, type) {
  if (busy) {
    log.state('Build: busy...');
    setTimeout(() => build(config, type), 500);
    return;
  }
  busy = true;
  for (const target of Object.keys(config.targets)) {
    for (const entry of config.targets[target]) {
      try {
        const options = helpers.merge(defaults, config.global);
        options.minifyWhitespace = config[type.type].minify === true;
        options.minifyIdentifiers = config[type.type].minify === true;
        options.minifySyntax = config[type.type].minify === true;
        options.entryPoints = [entry.input];
        options.outfile = entry.output;
        log.data(options);
        const meta = await esbuild.build(options);
        const stats = await getStats(meta);
        log.state(`Build: type: ${type.type} target: ${target} input: ${entry.input}, stats`, stats);
      } catch (err) {
        log.error('Build error', JSON.stringify(err.errors || err, null, 2));
        if (require.main === module) process.exit(1);
      }
    }
  }
  busy = false;
}

exports.build = build;
