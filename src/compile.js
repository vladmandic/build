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
async function run(config, steps) {
  if (busy) {
    log.state('Build:', { busy });
    setTimeout(() => run(config), 1000);
    return;
  }
  busy = true;
  if (!config || !config.build || !config.build.targets || config.build.targets.length === 0) {
    log.warn('Build: no targets');
  }
  for (const entry of config.build.targets) {
    if (!entry.input || !entry.output || !entry.format) {
      log.error('Build incomplete configuration:', { format: entry.format, input: entry.input, output: entry.output });
      continue;
    }
    const options = helpers.merge(defaults, config.build.global, entry); // combine all options
    options.metafile = true; // force metadata output
    delete options.input; // set later as entrypoint
    delete options.output; // set later as outfile
    delete options.name; // logical name only
    delete options.typings; // used by typings
    delete options.typedoc; // used by tyepdoc
    if (typeof options.minify !== 'undefined') {
      options.minifyWhitespace = options.minify;
      options.minifyIdentifiers = options.minify;
      options.minifySyntax = options.minify;
      delete options.minify;
    }
    options.entryPoints = [entry.input]; // set entrypoints
    options.outfile = entry.output; // set output
    if (!options.platform) options.platform = entry.format === 'cjs' ? 'node' : 'browser'; // autodetect platform if not set
    if (!options.external) options.external = entry.external || []; // set external if not existing
    if (!options.external.includes('@vladmandic/build')) options.external.push('@vladmandic/build'); // exclude build itself
    if (config.log.debug) log.data('ESBuild Options:', options);
    try {
      const meta = await esbuild.build(options);
      if (config.log.debug) log.data('ESBuild Metadata:', meta);
      const stats = await getStats(meta);
      log.state('Compile:', { name: entry.name || '', format: entry.format, platform: entry.platform, input: entry.input, output: stats.outputFiles, files: stats.imports, inputBytes: stats.importBytes, outputBytes: stats.outputBytes });
    } catch (err) {
      log.error('Compile:', { name: entry.name || '', format: entry.format, platform: entry.platform, input: entry.input }, { errors: err.errors || err });
      if (require.main === module) process.exit(1);
    }
    if (steps.includes('typings') && entry.typings && entry.typings !== '') await typings.run(config, entry);
    if (steps.includes('typedoc') && entry.typedoc && entry.typedoc !== '') await typedoc.run(config, entry);
  }
  busy = false;
}

exports.run = run;
exports.version = version;
