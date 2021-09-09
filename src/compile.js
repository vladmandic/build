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
  for (const entry of config.build.targets) {
    if (!entry.input || !entry.output || !entry.format) {
      log.error('Build incomplete configuration:', { type: type.type, format: entry.format, input: entry.input, output: entry.output });
      continue;
    }
    const options = helpers.merge(defaults, config.build.global);
    options.minifyWhitespace = config.build[type.type].minify === true;
    options.minifyIdentifiers = config.build[type.type].minify === true;
    options.minifySyntax = config.build[type.type].minify === true;
    options.entryPoints = [entry.input];
    options.outfile = entry.output;
    options.metafile = true;
    options.format = entry.format;
    if (entry.platform) options.platform = entry.platform;
    else options.platform = entry.format === 'cjs' ? 'node' : 'browser';
    if (entry.external) options.external = entry.external;
    if (config.debug) log.data('ESBuild Options:', options);
    try {
      const meta = await esbuild.build(options);
      if (config.debug) log.data('ESBuild Metadata:', meta);
      const stats = await getStats(meta);
      log.state('Build:', { type: type.type, format: entry.format, platform: entry.platform, input: entry.input, output: stats.outputFiles, files: stats.imports, inputBytes: stats.importBytes, outputBytes: stats.outputBytes });
    } catch (err) {
      log.error('Build:', { type: type.type, format: entry.format, platform: entry.platform, input: entry.input }, { errors: err.errors || err });
      if (require.main === module) process.exit(1);
    }
    if (type.type === 'production' && entry.typings && entry.typings !== '') await typings.run(config, entry);
    if (type.type === 'production' && entry.typedoc && entry.typedoc !== '') await typedoc.run(config, entry);
  }
  busy = false;
}

exports.build = build;
exports.version = version;
