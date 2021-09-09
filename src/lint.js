const fs = require('fs');
const log = require('@vladmandic/pilogger');
const { ESLint } = require('eslint');

const version = ESLint.version;

async function lint(config) {
  const json = fs.existsSync('.eslintrc.json') ? JSON.parse(fs.readFileSync('.eslintrc.json').toString()) : {};
  const options = {
    ...json,
    globals: { ...json.globals },
    rules: { ...config.lint.rules, ...json.rules },
    env: { ...config.lint.env, ...json.env },
    parser: json.parser || config.lint.parser,
    parserOptions: { ...config.lint.parserOptions, ...json.parserOptions },
    plugins: [...new Set([...config.lint.plugins, ...(json.plugins || [])])],
    extends: [...new Set([...config.lint.extends, ...(json.extends || [])])],
    ignorePatterns: [...new Set([...config.lint.ignorePatterns, ...(json.ignorePatterns || [])])],
  };
  const eslint = new ESLint({ overrideConfig: options });
  if (config.debug) log.data('ESLint Options', options, config.lint.locations);
  const results = await eslint.lintFiles(config.lint.locations);
  const errors = results.reduce((prev, curr) => prev += curr.errorCount, 0);
  const warnings = results.reduce((prev, curr) => prev += curr.warningCount, 0);
  if (config.debug) log.data('Lint Results:', results);
  log.state('Lint:', { locations: config.lint.locations, files: results.length, errors, warnings });
  if (errors > 0 || warnings > 0) {
    const formatter = await eslint.loadFormatter('stylish');
    const text = formatter.format(results);
    log.warn(text);
  }
}

exports.run = lint;
exports.version = version;
