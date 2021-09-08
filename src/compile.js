const log = require('@vladmandic/pilogger');
const esbuild = require('esbuild');
const helpers = require('./helpers');
const typedoc = require('./typedoc.js');
const typings = require('./typings.js');

const version = esbuild.version;

let busy = false;

const defaults = {
  logLevel: 'error',
  bundle: true,
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
    log.state('Build:', { type: type.type, busy });
    setTimeout(() => build(config, type), 1000);
    return;
  }
  busy = true;
  for (const target of Object.keys(config.build.targets)) {
    for (const entry of config.build.targets[target]) {
      try {
        const options = helpers.merge(defaults, config.build.global);
        options.minifyWhitespace = config.build[type.type].minify === true;
        options.minifyIdentifiers = config.build[type.type].minify === true;
        options.minifySyntax = config.build[type.type].minify === true;
        options.entryPoints = [entry.input];
        options.outfile = entry.output;
        options.metafile = true;
        options.platform = target === 'node' ? 'node' : 'browser';
        const meta = await esbuild.build(options);
        const stats = await getStats(meta);
        log.state('Build:', { type: type.type, target, input: entry.input, output: stats.outputFiles, files: stats.imports, inputBytes: stats.importBytes, outputBytes: stats.outputBytes });
      } catch (err) {
        log.error('Build error', JSON.stringify(err.errors || err, null, 2));
        if (require.main === module) process.exit(1);
      }
      if (type.type === 'production' && entry.typings) await typings.run(config.typescript, entry);
      if (type.type === 'production' && entry.typedoc) await typedoc.run(config.typedoc, entry);
    }
  }
  busy = false;
}

exports.build = build;
exports.version = version;
