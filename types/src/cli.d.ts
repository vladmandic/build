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
export function run(): void;
