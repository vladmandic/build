const fs = require('fs');
const ts = require('typescript');
const path = require('path');
const log = require('@vladmandic/pilogger');

const version = ts.version;

async function typings(config, entry) {
  const configFileName = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json') || '';
  const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './');
  compilerOptions.options = {
    ...config.typescript,
    ...compilerOptions.options,
    emitDeclarationOnly: true,
    declaration: true,
    outDir: entry.typings,
  };
  compilerOptions.include = [path.dirname(entry.input)];
  compilerOptions.exclude = ['node_modules/', 'dist/'];
  compilerOptions.errors = [];
  if (config.log.debug) log.data('TypeScript Options:', compilerOptions);
  const compilerHost = ts.createCompilerHost(compilerOptions.options);
  const program = ts.createProgram([entry.input], compilerOptions.options, compilerHost);

  if (config.generate) {
    if (fs.existsSync('tsconfig.json')) log.warn('Generate config file exists:', ['tsconfig.json']);
    else {
      const tsconfig = { compilerOptions: compilerOptions.options, include: compilerOptions.include, exclude: compilerOptions.exclude };
      delete tsconfig.compilerOptions.emitDeclarationOnly;
      delete tsconfig.compilerOptions.resolveJsonModule;
      tsconfig.compilerOptions.lib = tsconfig.compilerOptions.lib.map((lib) => lib.replace('lib.', '').replace('.d.ts', ''));
      fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
      log.info('Generate config file:', ['tsconfig.json']);
    }
  }

  const emit = program.emit();
  const diag = ts
    .getPreEmitDiagnostics(program)
    .concat(emit.diagnostics);
  log.state('Typings:', { input: entry.input, output: compilerOptions.options.outDir, files: emit.emittedFiles?.length });
  if (config.log.debug) log.data('TypeScript Diag', { nodes: program.getNodeCount(), identifiers: program.getIdentifierCount(), symbols: program.getSymbolCount(), types: program.getTypeCount(), instances: program.getInstantiationCount() });
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
