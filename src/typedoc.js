const fs = require('fs');
const path = require('path');
const process = require('process');
const log = require('@vladmandic/pilogger');
const TypeDoc = require('typedoc');
const simpleGit = require('simple-git/promise');

const git = simpleGit();

const version = TypeDoc.Application.VERSION;

const defaults = {
  excludePrivate: true,
  excludeExternals: true,
  excludeProtected: true,
  excludeInternal: true,
  // disableSources: true,
  gitRevision: 'main',
  hideGenerator: 'true',
  readme: 'none', // 'README.md',
  includeVersion: true,
  entryPoints: [],
  exclude: [],
  externalPattern: ['node_modules/'],
  logLevel: 'Verbose',
  logger: 'none',
};

async function typedoc(config, entry) {
  try {
    const branch = await git.branchLocal();
    if (branch && branch.current) defaults.gitRevision = branch.current;
  } catch { /**/ }

  const td = new TypeDoc.Application();
  td.options.addReader(new TypeDoc.TSConfigReader());
  td.options.addReader(new TypeDoc.TypeDocReader());
  td.bootstrap({ entryPoints: [entry.input] }); // initialize td.options with default values
  const localTSdefaults = { ...config.typescript };
  if (localTSdefaults.emitDeclarationOnly) delete localTSdefaults.emitDeclarationOnly;
  for (const [key, val] of Object.entries(localTSdefaults)) td.options._compilerOptions[key] = val; // override TypeDoc TS compileOptions
  for (const [key, val] of Object.entries(defaults)) td.options.setValue(key, val); // override TypeDoc options
  td.options.setValue('entryPoints', [entry.input]);
  td.options.setValue('out', entry.typedoc);
  if (td.options._fileNames.length === 0) td.options._fileNames = [entry.input]; // normally its an expanded list based on tsconfig.json:inputs

  // let theme = require.resolve('@vladmandic/build');
  // theme = path.join(path.dirname(theme), '../typedoc-theme');
  const theme = path.join(__dirname, '../typedoc-theme');
  td.options.setValue('theme', fs.existsSync(theme) ? theme : 'typedoc-theme');
  if (config.log.debug) log.data('TypeDoc Options:', td.options);

  if (config.generate) {
    if (fs.existsSync('typedoc.json')) log.warn('Generate config file exists:', ['typedoc.json']);
    else {
      fs.writeFileSync('typedoc.json', JSON.stringify(td.options._values, null, 2));
      log.info('Generate config file:', ['typedoc.json']);
    }
  }

  // log.data(td.options);
  td.logger.warn = log.warn;
  td.logger.error = log.error;
  td.logger.verbose = config.log.debug ? log.data : () => { /***/ }; // remove extra logging

  td.logger.log = log.error; // converter writes errors to stdout
  const project = td.convert();
  if (!project) {
    log.error('TypeDoc: convert returned empty project');
    return;
  }
  if (td.logger.hasErrors() || td.logger.hasWarnings()) log.warn('TypeDoc:', { errors: td.logger.errorCount, warnings: td.logger.warningCount });
  td.logger.log = () => { /***/ }; // remove extra logging

  const stdout = process.stdout.write;
  process.stdout.write = () => { /**/ }; // hide progress bar
  const result = project ? await td.generateDocs(project, entry.typedoc) : null;
  process.stdout.write = stdout;

  if (result) log.warn('TypeDoc:', result);
  else log.state('TypeDoc:', { input: entry.input, output: entry.typedoc, objects: project.children?.length, index: fs.existsSync(path.join(entry.typedoc), 'index.html') });
  if (typeof project.children === 'undefined') log.warn('TypeDoc:', 'no output generated');
}

exports.run = typedoc;
exports.version = version;
