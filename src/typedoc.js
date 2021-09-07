const process = require('process');
const log = require('@vladmandic/pilogger');
const TypeDoc = require('typedoc');

const td = new TypeDoc.Application();
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
  theme: 'typedoc-theme',
};

async function typedoc(options, entry) {
  td.options.addReader(new TypeDoc.TypeDocReader());
  td.options.addReader(new TypeDoc.TSConfigReader());
  td.bootstrap({ entryPoints: [entry.input] });
  for (const [key, val] of Object.entries(defaults)) td.options.setValue(key, val);
  td.options.setValue('entryPoints', [entry.input]);
  td.options.setValue('out', entry.typedoc);

  // log.data(td.options);
  td.logger.warn = log.warn;
  td.logger.error = log.error;
  td.logger.verbose = () => { /***/ }; // remove extra logging
  // td.logger.verbose = log.data;
  td.logger.log = () => { /***/ }; // remove extra logging
  // td.logger.log = log.info;
  const project = td.convert();
  if (!project) {
    log.error('TypeDoc: convert returned empty project');
    return;
  }
  if (td.logger.hasErrors() || td.logger.hasWarnings()) log.warn('TypeDoc:', { errors: td.logger.errorCount, warnings: td.logger.warningCount });

  const stdout = process.stdout.write;
  process.stdout.write = () => { /**/ };
  const result = project ? await td.generateDocs(project, entry.typedoc) : null;
  process.stdout.write = stdout;

  if (result) log.warn('TypeDoc:', result);
  else log.state('TypeDoc:', { input: entry.input, output: entry.typedoc, objects: project.children?.length });
}

exports.run = typedoc;
exports.version = version;
