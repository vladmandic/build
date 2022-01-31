import * as fs from 'fs';
import * as log from '@vladmandic/pilogger';
import * as compile from './compile';
import * as watch from './watch';
import * as serve from './serve';
import * as lint from './lint';
import * as typedoc from './typedoc';
import * as typings from './typings';
import * as helpers from './helpers';
import { defaults } from './defaults';
import * as clean from './clean';
import * as changelog from './changelog';
import * as cli from './cli';
import { Config, Targets, Steps } from './interfaces';
import * as app from '../package.json';

export { Config, Targets, Steps } from './interfaces';

/*
process.on('SIGINT', () => {
  log.info('Build exiting...');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  if (!err) log.fatal('Rejection', 'no error message');
  else log.fatal('Rejection', err['message'] || err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  log.fatal('Exception', err?.message || err || 'no error message');
  process.exit(1);
});
*/

/**
 * Class Build
 */
export class Build {
  /**
   * Command line params when used in Cli mode
   */
  params = { debug: false, config: '', generate: false, profile: '' };

  /**
   * Contains version strings of all build tools
   * @property `build` semver version string
   * @property `esbuild` semver version string
   * @property `typescript` semver version string
   * @property `typedoc` semver version string
   * @property `eslint` semver version string
   */
  toolchain = { build: 'version', esbuild: 'version', typescript: 'version', typedoc: 'version', eslint: 'version' };

  /**
   * Contains detected available configuration
   * @property `config` name of the parsed config file
   * @property `tsconfig` is `tsconfig.json` present?
   * @property `eslintrc` is `eslintrc.json` present?
   * @property `git` is this a valid git repository?
   */
  environment = { config: <string | undefined>undefined, package: <string | undefined>undefined, tsconfig: <boolean>false, eslintrc: <boolean>false, git: <boolean>false };

  /**
   * Contains detected application information
   * @property `name` application name
   * @property `version` application version
   */
  application = { name: '', version: '' };

  /**
   * Contains parsed application package.json file
   */
  package: Record<string, unknown>;

  /**
   * Contains currently active build configuration
   *
   * Configuration is combined from:
   * - Build defaults
   * - Parsing optional `build.json` or user specified config file
   * - Parsing optional `tsconfig.json`
   * - Parsing optional `eslintrc.json`
   * - Parsing optional `typedoc.json`
   *
   * @property `log` control build logging
   * @property `clean` control location cleaning at the beggining of build process
   * @property `lint` configuration for project linting
   * @property `changelog` configuration for changelog generation
   * @property `build` configuration for project build step and all individual targets which includes: **build**, **bundle**, **typedoc**, **typings**
   * @property `serve` configuration for http/https web server used in dev build profile
   * @property `watch` configuration for file/folder watcher used in dev build profile
   * @property `typescript` override compiler configuration for typescript
   */
  // @ts-ignore ignore string enum mismatches when reading from json file
  config: Config = { ...defaults };

  /**
   * Initializes Build class with all parsed configurations
   *
   * @param config {@link Config} Optional configuration options overrides
   */
  constructor(config?: Partial<Config>) {
    this.config = this.updateConfig(helpers.merge(defaults), config);
    const tsconfig = fs.existsSync('tsconfig.json');
    const eslintrc = fs.existsSync('.eslintrc.json');
    const git = fs.existsSync('.git') && fs.existsSync('.git/config');
    this.package = this.packageJson();
    this.toolchain = { build: app.version, esbuild: compile.version, typescript: typings.version, typedoc: typedoc.version, eslint: lint.version };
    this.environment = { ...this.environment, tsconfig, eslintrc, git };
    this.application = { name: this.package['name'] as string, version: this.package['version'] as string };
    log.configure({ inspect: { breakLength: 265 } });
    // log.ringLength = 1000; // increase log ring buffer
    log.options.console = this.config.log.console;
    if (this.config.log.enabled && this.config.log.output && this.config.log.output !== '') log.logFile(this.config.log.output);
  }

  updateConfig = (config, options = {}) => {
    // set defaults
    let local = helpers.merge(config);
    // reset defaults to emtpy project
    local.profiles = {};
    local.clean.locations = [];
    local.lint.locations = [];
    local.watch.locatinos = [];
    local.build.targets = [];
    if (fs.existsSync('.build.json')) { // add options from parsed build.json
      const data = fs.readFileSync('.build.json');
      local = helpers.merge(local, JSON.parse(data.toString()));
      this.environment.config = '.build.json';
    }
    if (fs.existsSync('build.json')) { // add options from parsed build.json
      const data = fs.readFileSync('build.json');
      local = helpers.merge(local, JSON.parse(data.toString()));
      this.environment.config = 'build.json';
    }
    if (Object.keys(options).length) local = helpers.merge(local, options);
    for (const profile of Object.keys(local.profiles)) local.profiles[profile] = [...new Set([...Object.values(local.profiles[profile])])]; // deduplicate profile steps
    return local;
  };

  packageJson = () => {
    if (!fs.existsSync('package.json')) {
      log.error('Package definition not found:', 'package.json');
      process.exit(1);
    }
    const data = fs.readFileSync('package.json');
    const json = JSON.parse(data.toString());
    this.environment.package = 'package.json';
    return json;
  };

  /**
   * Runs build pipeline for specified profile
   *
   * @param profile Profile type, e.g. "production" or "development"
   * @param config {@link Config} Optional configuration options overrides
   * @returns Object containing all messages
   */
  async run(profile: string, config: Partial<Config> = {}) {
    this.config = this.updateConfig(this.config, config);
    helpers.info(profile, this.application, this.environment, this.toolchain);
    const steps = Object.values(this.config.profiles[profile]);
    log.info('Build:', { profile, steps });
    if (this.config.log.debug) log.data('Configuration:', this.config);
    for (const step of steps) {
      switch (step) {
        case 'clean': await clean.run(this.config); break;
        case 'compile': await compile.run(this.config, steps, profile); break;
        case 'lint': await lint.run(this.config); break;
        case 'changelog': await changelog.run(this.config, this.packageJson); break;
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

  async clean() { return clean.run(this.config); }
  async lint() { return lint.run(this.config); }
  async changelog() { return changelog.run(this.config, this.packageJson); }
  async serve() { return serve.start(this.config); }
  async compile(steps: Array<Steps>) { return compile.run(this.config, steps, ''); }
  async watch(steps: Array<Steps>) { return watch.start(this.config, steps); }
  async typings(target: Targets) { return typings.run(this.config, target); }
  async typedoc(target: Targets) { return typedoc.run(this.config, target); }
}

if (require.main === module) {
  cli.run();
}
