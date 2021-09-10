const fs = require('fs');
const commander = require('commander').program;
const log = require('@vladmandic/pilogger');
const helpers = require('./helpers');
const main = require('./build.js');

/**
 * Runs build in cli mode
 *
 * Usage: build [options] [command]
 *
 * **Options:**
 * - `-c`, `--config` `<file>`  specify alternative config file
 * - `-d`, `--debug`            enable debug output
 * - `-g`, `--generate`         generate config files from templates
 * - `-h`, `--help`             display help for command
 *
 * **Commands:**
 * - `development`          start development ci
 * - `production`           start production build
 * - `config`               show active configuration and exit
 * - `help [command]`       display help for command
 */
function run() {
  const build = new main.Build();

  if (build.config.log.enabled && build.config.log.output && build.config.log.output !== '') log.logFile(build.config.log.file);
  log.header();
  if (build.environment.tsconfig) build.config.build.global.tsconfig = 'tsconfig.json';
  let params = {};
  commander.option('-c, --config <file>', 'specify config file');
  commander.option('-d, --debug', 'enable debug output');
  commander.option('-g, --generate', 'generate config files from templates');
  commander.command('development').description('start development ci').action(() => params.command = 'development');
  commander.command('production').description('start production build').action(() => params.command = 'production');
  commander.command('config').description('show active configuration and exit').action(() => params.command = 'config');
  commander.parse(process.argv);
  params = { ...params, ...commander.opts() };
  if (params.debug) {
    log.info('Debug output:', params.debug);
    build.config.log.debug = true;
  }
  if (params.generate) {
    log.info('Generate config files:', params.generate);
    build.config.generate = true;
  }
  if (params.config && params.config !== '') {
    if (fs.existsSync(params.config)) {
      const data = fs.readFileSync(params.config);
      try {
        build.config = helpers.merge(build.config, JSON.parse(data.toString()));
        log.info('Parsed config file:', params.config, build.config);
      } catch {
        log.error('Error parsing config file:', params.config);
      }
    } else {
      log.error('Config file does not exist:', params.config);
    }
  }
  switch (params.command) {
    case 'development': build.development(); break;
    case 'production': build.production(); break;
    case 'config': {
      helpers.info('production', build.application, build.environment, build.toolchain);
      log.data('Configuration:', build.config);
      break;
    }
    default:
  }
}

exports.run = run;
