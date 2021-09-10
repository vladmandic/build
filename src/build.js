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
    log.ringLength = 1000; // increase log ring buffer
  }

  /**
   * Runs build pipeline for development profile
   *
   * @param options  `<object>` Optional configuration options overrides
   * @returns  `array<object>` Containing all messages
   */
  async development(options = {}) {
    if (Object.keys(options).length) this.config = updateConfig(this.config, options);
    helpers.info('development', this.application, this.environment, this.toolchain);
    if (this.config.debug) log.data('Configuration:', this.config);
    if (this.config.serve.enabled) await serve.start(this.config.serve);
    if (this.config.watch.enabled) await watch.start(this.config);
    if (this.config.build.enabled) await compile.build(this.config, { type: 'development' });
    return helpers.results();
  }

  /**
   * Runs build pipeline for production profile
   *
   * @param options  `<object>` Optional configuration options overrides
   * @returns  `array<object>` Containing all messages
   */
  async production(options = {}) {
    if (Object.keys(options).length) this.config = updateConfig(this.config, options);
    helpers.info('production', this.application, this.environment, this.toolchain);
    if (this.config.debug) log.data('Configuration:', this.config);
    if (this.config.clean.enabled) await clean.start(this.config.clean);
    if (this.config.build.enabled) await compile.build(this.config, { type: 'production' });
    if (this.config.lint.enabled) await lint.run(this.config);
    // if (config.typings.enabled) await typings.run(config.typings, entry.input); // triggered from compile.build
    // if (config.typedoc.enabled) await typedoc.run(config.typedoc, entry.input); // triggered from compile.build
    if (this.config.changelog.enabled && this.config.changelog.output && this.config.changelog.output !== '' && this.environment.git) await changelog.update(this.config, this.package); // generate changelog
    return helpers.results();
  }

  /**
   * Runs build pipeline for specified profile
   *
   * @param profile  `string` Profile type: "production" | "development"
   * @param options  `object` Optional configuration options overrides
   * @returns  `array<object>` Containing all messages
   */
  async build(profile = '', options = {}) {
    let res = [];
    if (profile === 'production') res = await this.production(options);
    else if (profile === 'development') res = await this.development(options);
    else log.error('Build:', 'unknonwn profile');
    return res;
  }
}

exports.Build = Build;

if (require.main === module) {
  cli.run();
}
