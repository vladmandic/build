const fs = require('fs');
const log = require('@vladmandic/pilogger');
const { ESLint } = require('eslint');

let eslint;
const version = ESLint.version;

async function lint(config) {
  const json = fs.existsSync('.eslintrc.json') ? JSON.parse(fs.readFileSync('.eslintrc.json').toString()) : {};
  if (!eslint) eslint = new ESLint({ useEslintrc: true, overrideConfig: { ...json, rules: { ...json.rules, ...config.rules } } });
  const results = await eslint.lintFiles(config.locations);
  const errors = results.reduce((prev, curr) => prev += curr.errorCount, 0);
  const warnings = results.reduce((prev, curr) => prev += curr.warningCount, 0);
  log.state('Lint:', { locations: config.locations, files: results.length, errors, warnings });
  if (errors > 0 || warnings > 0) {
    const formatter = await eslint.loadFormatter('stylish');
    const text = formatter.format(results);
    log.warn(text);
  }
}

exports.run = lint;
exports.version = version;
