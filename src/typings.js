const ts = require('typescript');
const path = require('path');
const log = require('@vladmandic/pilogger');

const version = ts.version;

const defaults = {
  module: 'es2020',
  target: 'es2020',
  typeRoots: ['node_modules/@types'],
  lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.webworker.d.ts'],
  baseUrl: './',
  paths: { tslib: ['node_modules/tslib/tslib.d.ts'] },
  sourceMap: true,
  noEmitOnError: false,
  emitDeclarationOnly: true,
  declaration: true,
  allowJs: true,
  allowSyntheticDefaultImports: true,
  importHelpers: true,
  pretty: true,
  removeComments: false,
  skipLibCheck: true,
  listEmittedFiles: true,
};

async function typings(config, entry) {
  const configFileName = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json') || '';
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
  // const compilerOptions = tsconfig;
  compilerOptions.options = {
    ...defaults,
    ...compilerOptions.options,
    ...config,
    emitDeclarationOnly: true,
    declaration: true,
    outDir: entry.typings,
  };
  compilerOptions.include = [path.dirname(entry.input)];
  compilerOptions.exclude = ['node_modules/', 'dist/'];
  compilerOptions.errors = [];
  // log.data('Typings compilerOptions', compilerOptions, config);
  const compilerHost = ts.createCompilerHost(compilerOptions.options);
  const program = ts.createProgram([entry.input], compilerOptions.options, compilerHost);
  const emit = program.emit();
  const diag = ts
    .getPreEmitDiagnostics(program)
    .concat(emit.diagnostics);
  log.state('Typings:', { input: entry.input, output: compilerOptions.options.outDir, files: emit.emittedFiles?.length });
  // log.data('TSC Diag', { nodes: program.getNodeCount(), identifiers: program.getIdentifierCount(), symbols: program.getSymbolCount(), types: program.getTypeCount(), instances: program.getInstantiationCount() });
  for (const info of diag) {
    const msg = info.messageText['messageText'] || info.messageText;
    if (msg.includes('package.json')) continue;
    if (info.file) {
      const pos = info.file.getLineAndCharacterOfPosition(info.start || 0);
      log.error(`TSC: ${info.file.fileName} [${pos.line + 1},${pos.character + 1}]:`, msg);
    } else {
      log.error('TSC:', msg);
    }
  }
}

exports.run = typings;
exports.version = version;
