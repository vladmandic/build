const fs = require('fs');
const process = require('process');
const commander = require('commander').program;
const log = require('@vladmandic/pilogger');
const compile = require('./compile.js');
const watch = require('./watch.js');
const serve = require('./serve.js');
const lint = require('./lint.js');
const typedoc = require('./typedoc.js');
const typings = require('./typings.js');
const helpers = require('./helpers');
const defaults = require('../build.json');
const clean = require('./clean.js');
const changelog = require('./changelog.js');

let config;

process.on('SIGINT', () => {
  log.info('Build exiting...');
  process.exit(0);
});

const tsconfig = fs.existsSync('tsconfig.json');
const eslintrc = fs.existsSync('.eslintrc.json');
const git = fs.existsSync('.git') && fs.existsSync('.git/config');

async function development(userConfig) {
  if (userConfig) config = helpers.merge(config, userConfig);
  log.info('Environment:', { profile: 'development', tsconfig, eslintrc, git });
  if (config.serve.enabled) await serve.start(config.serve);
  if (config.watch.enabled) await watch.start(config);
  if (config.build.enabled) await compile.build(config, { type: 'development' });
}

async function production(userConfig) {
  if (userConfig) config = helpers.merge(config, userConfig);
  log.info('Environment:', { profile: 'production', tsconfig, eslintrc, git });
  if (config.lint.enabled) await lint.run(config.lint);
  if (config.clean.enabled) await clean.start(config.clean);
  if (config.build.enabled) await compile.build(config, { type: 'production' });
  // if (config.typings.enabled) await typings.run(config.typings, entry.input); // triggered from compile.build
  // if (config.typedoc.enabled) await typedoc.run(config.typedoc, entry.input); // triggered from compile.build
  if (config.changelog.enabled && git) await changelog.update(config.changelog); // generate changelog
  log.info('Profile production done');
}

async function build({ type, options }) {
  if (type === 'production') production(options);
  if (type === 'development') development(options);
}
function cli(userConfig) {
  config = helpers.merge(defaults, userConfig || {});
  if (config.log.enabled) log.logFile(config.log.file);

  log.header();
  log.info('Toolchain:', { esbuild: compile.version, typescript: typings.version, typedoc: typedoc.version, eslint: lint.version });
  if (tsconfig) config.build.global.tsconfig = 'tsconfig.json';

  if (!fs.existsSync('package.json')) {
    log.error('Package definition not found:', 'package.json');
    process.exit(1);
  }

  commander.option('-c, --config <file>', 'specify config file: default build.json');
  commander.command('development')
    .description('start development ci')
    .action(async () => development());
  commander.command('production')
    .description('start production build')
    .action(async () => production());
  commander.parse(process.argv);
  const options = commander.opts();
  if (options.config) {
    if (fs.existsSync(options.config)) {
      const data = fs.readFileSync(options.config);
      try {
        config = helpers.merge(config, JSON.parse(data.toString()));
        log.info('Parsed config file:', options.config, config);
      } catch {
        log.error('Error parsing config file:', options.config);
      }
    } else {
      log.error('Config file does not exist:', options.config);
    }
  }
}

exports.production = production;
exports.development = development;
exports.build = build;

cli();
