import * as log from '@vladmandic/pilogger';
import * as esbuild from 'esbuild';
import * as helpers from './helpers';
import * as typedoc from './typedoc';
import * as typings from './typings';

export const version = esbuild.version;

let busy = false;

async function getStats(json) {
  const stats = { modules: 0, moduleBytes: 0, imports: 0, importBytes: 0, outputBytes: 0, outputFiles: '' };
  if (json && json.metafile?.inputs && json.metafile?.outputs) {
    for (const [key, val] of Object.entries(json.metafile.inputs)) {
      if (key.startsWith('node_modules')) {
        stats.modules += 1;
        stats.moduleBytes += (val as Record<string, number>)['bytes'] as number;
      } else {
        stats.imports += 1;
        stats.importBytes += (val as Record<string, number>)['bytes'];
      }
    }
    const files: Array<string> = [];
    for (const [key, val] of Object.entries(json.metafile.outputs)) {
      if (!key.endsWith('.map')) {
        files.push(key);
        stats.outputBytes += (val as Record<string, number>)['bytes'];
      }
    }
    stats.outputFiles = files.join(', ');
  }
  return stats;
}

// rebuild on file change
export async function run(config, steps, profile) {
  if (busy) {
    log.state('Build:', { busy });
    setTimeout(() => run(config, steps, profile), 1000);
    return;
  }
  busy = true;
  if (!config || !config.build || !config.build.targets || config.build.targets.length === 0) {
    log.warn('Build: no targets');
  }
  for (const entry of config.build.targets) {
    if (!entry.input || !entry.output) {
      log.error('Build incomplete configuration:', { input: entry.input, output: entry.output });
      continue;
    }
    const options = helpers.merge(config.build.global, config.build[profile], entry); // combine all options
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
    if (!options.platform) options.platform = options.format === 'cjs' ? 'node' : 'browser'; // autodetect platform if not set
    if (!options.external) options.external = entry.external || []; // set external if not existing
    if (!options.external.includes('@vladmandic/build')) options.external.push('@vladmandic/build'); // exclude build itself
    if (config.log.debug) log.data('ESBuild Options:', options);
    let ok = true;
    try {
      const meta = await esbuild.build(options);
      if (config.log.debug) log.data('ESBuild Metadata:', meta);
      const stats = await getStats(meta);
      log.state('Compile:', { name: entry.name || '', format: options.format, platform: options.platform, input: entry.input, output: stats.outputFiles, files: stats.imports, inputBytes: stats.importBytes, outputBytes: stats.outputBytes });
    } catch (err) {
      log.error('Compile:', { name: entry.name || '', format: options.format, platform: options.platform, input: entry.input }, { errors: (err as Record<string, string>)['errors'] || err });
      ok = false;
    }
    if (ok && steps.includes('typings') && entry.typings && entry.typings !== '') await typings.run(config, entry);
    if (ok && steps.includes('typedoc') && entry.typedoc && entry.typedoc !== '') await typedoc.run(config, entry);
  }
  busy = false;
}
