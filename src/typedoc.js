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
  td.options.addReader(new TypeDoc.TypeDocReader());
  td.options.addReader(new TypeDoc.TSConfigReader());
  td.bootstrap({ entryPoints: [entry.input] });
  for (const [key, val] of Object.entries(defaults)) td.options.setValue(key, val);
  td.options.setValue('entryPoints', [entry.input]);
  td.options.setValue('out', entry.typedoc);

  try {
    // eslint-disable-next-line node/no-missing-require
    let theme = require.resolve('@vladmandic/build');
    theme = path.join(path.dirname(theme), '../typedoc-theme');
    td.options.setValue('theme', theme);
  } catch {
    td.options.setValue('theme', 'typedoc-theme');
  }
  if (config.debug) log.data('TypeDoc Options:', td.options);

  // log.data(td.options);
  td.logger.warn = log.warn;
  td.logger.error = log.error;
  td.logger.verbose = config.debug ? log.data : () => { /***/ }; // remove extra logging

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
  else log.state('TypeDoc:', { input: entry.input, output: entry.typedoc, objects: project.children?.length });
}

exports.run = typedoc;
exports.version = version;
