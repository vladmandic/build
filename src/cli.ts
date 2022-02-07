import * as fs from 'fs';
import * as log from '@vladmandic/pilogger';
import { program as commander } from 'commander';
import * as helpers from './helpers';
import * as main from './build';

/**
 * Runs build in cli mode
 *
 * Usage: build [options] [command]
 *
 * **Options:**
 * - `-c`, `--config` `<file>`      show active configuration or specify alternative config file
 * - `-d`, `--debug`                enable debug output
 * - `-p`, `--profile` `<profile>`  run build for specific profile
 * - `-l`, `--list`                 list configured build profiles
 * - `-g`, `--generate`             generate config files from templates
 * - `-h`, `--help`                 display help for command
*/
export function run() {
  const build = new main.Build();

  log.header();
  if (build.environment.tsconfig) (build.config.build.global as Record<string, unknown>)['tsconfig'] = 'tsconfig.json';
  // let params: Record<string, unknown> = {};
  commander.option('-c, --config <file>', 'specify config file');
  commander.option('-d, --debug', 'enable debug output');
  commander.option('-g, --generate', 'generate config files from templates');
  commander.option('-l, --list', 'list configured build profiles');
  commander.option('-p, --profile <profile>', 'run build for specific profile');
  commander.parse(process.argv);
  build.params = { ...build.params, ...commander.opts() };
  if (build.params.debug) {
    log.info('Debug output:', build.params.debug);
    build.config.log.debug = true;
  }
  if (build.params.generate) {
    log.info('Generate config files:', build.params.generate);
    build.config['generate'] = true;
  }
  if (build.params.config && build.params.config !== '') {
    if (fs.existsSync(build.params.config as string)) {
      build.environment.config = build.params.config;
      const data = fs.readFileSync(build.params.config as string);
      try {
        const parsedConfig = JSON.parse(data.toString());
        build.config = helpers.merge(build.config, parsedConfig);
        if (build.params.debug) log.info('Parsed config file:', build.params.config, parsedConfig);
      } catch {
        log.error('Error parsing config file:', build.params.config);
      }
    } else {
      log.error('Config file does not exist:', build.params.config);
    }
  }
  if (commander.opts().list) {
    log.info('Configured build profiles:');
    log.data(build.config.profiles);
    process.exit();
  }
  const profile = build.params.profile || build.config.default;
  if (!profile) {
    log.error('Profile not specified and no Default profile configured');
  } else if (!build.config.profiles) {
    log.error('Profiles not configured');
  } else {
    build.run(profile as string);
  }
}
