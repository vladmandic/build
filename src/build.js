const fs = require('fs');
const process = require('process');
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
const cli = require('./cli.js');
const app = require('../package.json');

process.on('SIGINT', () => {
  log.info('Build exiting...');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  log.fatal('Rejection', err?.message || err || 'no error message');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  log.fatal('Exception', err?.message || err || 'no error message');
  process.exit(1);
});

const packageJson = () => {
  if (!fs.existsSync('package.json')) {
    log.error('Package definition not found:', 'package.json');
    process.exit(1);
  }
  const data = fs.readFileSync('package.json');
  const json = JSON.parse(data);
  return json;
};

const updateConfig = (config, options) => {
  // set defaults
  let local = helpers.merge(config);
  // reset defaults to emtpy project
  local.clean.locations = [];
  local.lint.locations = [];
  local.watch.locatinos = [];
  local.build.targets = [];
  if (fs.existsSync('build.json')) { // add options from parsed build.json
    const data = fs.readFileSync('build.json');
    local = helpers.merge(local, JSON.parse(data.toString()));
  }
  if (Object.keys(options).length) local = helpers.merge(local, options);
  for (const profile of Object.keys(local.profiles)) local.profiles[profile] = [...new Set([...Object.values(local.profiles[profile])])]; // deduplicate profile steps
  return local;
};

class Build {
  /**
   * Command line params when used in Cli mode
   */
  params = { debug: false, config: '' };

  /**
   * Contains version strings of all build tools
   * @typedef {object} Toolchain
   * @property {string} build semver version string
   * @property {string} esbuild semver version string
   * @property {string} typescript semver version string
   * @property {string} typedoc semver version string
   * @property {string} eslint semver version string
   * @type {Toolchain}
   */
  toolchain = { build: 'version', esbuild: 'version', typescript: 'version', typedoc: 'version', eslint: 'version' };

  /**
   * Contains detected available configuration
   * @typedef {object} Environment
   * @property {string} config name of the parsed config file
   * @property {boolean} tsconfig is `tsconfig.json` present?
   * @property {boolean} eslintrc is `eslintrc.json` present?
   * @property {boolean} git is this a valid git repository?
   * @type {Environment}
   */
  environment = { config: '', tsconfig: false, eslintrc: false, git: false };

  /**
   * Contains detected application information
   * @typedef {object} Application
   * @property {string} name application name
   * @property {string} version application version
   * @type {Environment}
   */
  application = { name: '', version: '' };

  /**
   * Contains parsed application package.json file
   * @typedef {object} PackageJson
   * @type {PackageJson}
   */
  package = {};

  /**
   * Contains currently active build configuration
   *
   * Configuration is combined from:
   * - Build defaults
   * - Parsing mandatory `build.json`
   * - Parsing optional `tsconfig.json`
   * - Parsing optional `eslintrc.json`
   * - Parsing optional `typedoc.json`
   * @typedef {object} Config
   * @property {object} log control build logging
   * @property {object} clean control location cleaning at the beggining of build process
   * @property {object} lint configuration for project linting
   * @property {object} changelog configuration for changelog generation
   * @property {object} build configuration for project build step and all individual targets which includes: **build**, **bundle**, **typedoc**, **typings**
   * @property {object} serve configuration for http/https web server used in dev build profile
   * @property {object} watch configuration for file/folder watcher used in dev build profile
   * @property {object} typescript override compiler configuration for typescript
   * @type {Config}
   */
  config = { ...defaults };

  /**
   * Initializes Build class with all parsed configurations
   *
   * @param options  `<object>` Optional configuration options overrides
   */
  constructor(options = {}) {
    this.config = updateConfig(helpers.merge(defaults), options);
    const tsconfig = fs.existsSync('tsconfig.json');
    const eslintrc = fs.existsSync('.eslintrc.json');
    const git = fs.existsSync('.git') && fs.existsSync('.git/config');
    this.package = packageJson();
    this.toolchain = { build: app.version, esbuild: compile.version, typescript: typings.version, typedoc: typedoc.version, eslint: lint.version };
    this.environment = { config: 'build.json', tsconfig, eslintrc, git };
    this.application = { name: this.package.name, version: this.package.version };
    log.configure({ inspect: { breakLength: 265 } });
    log.ringLength = 1000; // increase log ring buffer
    log.options.console = this.config.log.console;
    if (this.config.log.enabled && this.config.log.output && this.config.log.output !== '') log.logFile(this.config.log.output);
  }

  /**
   * Runs build pipeline for specified profile
   *
   * @param profile  `string` Profile type: "production" | "development"
   * @param options  `object` Optional configuration options overrides
   * @returns  `array<object>` Containing all messages
   */
  async run(profile, options = {}) {
    if (Object.keys(options).length) this.config = updateConfig(this.config, options);
    helpers.info(profile, this.application, this.environment, this.toolchain);
    const steps = Object.values(this.config.profiles[profile]);
    log.info('Build:', { profile, steps });
    if (this.config.log.debug) log.data('Configuration:', this.config);
    for (const step of steps) {
      switch (step) {
        case 'clean': await clean.run(this.config); break;
        case 'compile': await compile.run(this.config, steps); break;
        case 'lint': await lint.run(this.config); break;
        case 'changelog': await changelog.run(this.config, packageJson); break;
        case 'serve': await serve.start(this.config); break;
        case 'watch': await watch.start(this.config, steps); break;
        case 'typings': break; // triggered as compile step per target
        case 'typedoc': break; // triggered as compile step per target
        default: log.warn('Build: unknown step', step);
      }
    }
    if (steps.includes('serve')) log.info('Listening...');
    else log.info('Done...');
    return helpers.results();
  }
}

exports.Build = Build;

if (require.main === module) {
  cli.run();
}
