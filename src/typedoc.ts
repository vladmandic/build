import * as fs from 'fs';
import * as path from 'path';
import * as log from '@vladmandic/pilogger';
import * as TypeDoc from 'typedoc';
import simpleGit from 'simple-git/promise';
// import * as process from 'process'; // internal

const git = simpleGit();

export const version = TypeDoc.Application.VERSION;

const defaults = {
  excludePrivate: true,
  excludeExternals: true,
  excludeProtected: true,
  excludeInternal: true,
  disableSources: false,
  gitRevision: 'main',
  hideGenerator: 'true',
  readme: 'none', // 'README.md',
  includeVersion: true,
  entryPoints: [],
  exclude: [],
  externalPattern: ['node_modules/'],
  // githubPages: true,
  logLevel: 'Verbose',
  logger: 'none',
  validation: {
    notExported: true,
    invalidLink: true,
  },
};

export async function run(config, entry) {
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
  // @ts-ignore private options
  for (const [key, val] of Object.entries(localTSdefaults)) td.options._compilerOptions[key] = val; // override TypeDoc TS compileOptions
  for (const [key, val] of Object.entries(defaults)) td.options.setValue(key, val); // override TypeDoc options
  td.options.setValue('entryPoints', [entry.input]);
  td.options.setValue('out', entry.typedoc);
  // @ts-ignore private options
  if (td.options._fileNames.length === 0) td.options._fileNames = [entry.input]; // normally its an expanded list based on tsconfig.json:inputs

  // const theme = path.join(__dirname, '../typedoc-theme');
  // td.options.setValue('theme', fs.existsSync(theme) ? theme : 'typedoc-theme');
  if (config.log.debug) log.data('TypeDoc Options:', td.options);

  if (config.generate) {
    if (fs.existsSync('typedoc.json')) log.warn('Generate config file exists:', ['typedoc.json']);
    else {
      // @ts-ignore private options
      fs.writeFileSync('typedoc.json', JSON.stringify(td.options._values, null, 2));
      log.info('Generate config file:', ['typedoc.json']);
    }
  }

  // log.data(td.options);
  td.logger.warn = log.warn;
  td.logger.error = log.error;
  td.logger.verbose = config.log.debug ? log.data : () => { /***/ }; // remove extra logging

  // td.logger.log = log.error; // converter writes errors to stdout
  const project = td.convert();
  if (!project) {
    log.error('TypeDoc: convert returned empty project');
    return;
  }
  if (td.logger.hasErrors() || td.logger.hasWarnings()) log.warn('TypeDoc:', { errors: td.logger.errorCount, warnings: td.logger.warningCount });

  // capture stdout messages
  td.logger.log = () => { /***/ }; // remove extra logging
  const stdout = process.stdout.write;
  const msgs: Array<string> = [];
  process.stdout.write = (...msg) => (msgs.push(...msg) as unknown as boolean);
  const result = project ? await td.generateDocs(project, entry.typedoc) : null;
  process.stdout.write = stdout;
  for (const msg of msgs) {
    const lines = typeof msg === 'string' ? msg.split('\n') : [];
    if (lines.length > 0 && lines[1].length > 0) log.warn(lines[1].replace(/\u001b[^m]*?m/g, ''));
  }

  const generated = fs.existsSync(path.join(entry.typedoc, 'index.html'));
  if (result) log.warn('TypeDoc:', result);
  else log.state('TypeDoc:', { input: entry.input, output: entry.typedoc, objects: project.children?.length, generated });
  if (typeof project.children === 'undefined') log.warn('TypeDoc:', 'no output generated');
}
