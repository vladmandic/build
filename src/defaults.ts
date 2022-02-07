export const defaults = {
  log: {
    enabled: true,
    debug: false,
    console: true,
    output: 'build.log',
  },
  profiles: {
    production: ['clean', 'compile', 'typings', 'typedoc', 'lint', 'changelog'],
    development: ['serve', 'watch', 'compile'],
    lint: ['lint'],
    all: ['clean', 'compile', 'typings', 'typedoc', 'lint', 'changelog', 'serve', 'watch'],
  },
  watch: {
    locations: ['src/**'],
  },
  clean: {
    locations: ['types/*', 'typedoc/*'],
  },
  changelog: {
    output: 'CHANGELOG.md',
  },
  serve: {
    sslKey: 'cert/https.key',
    sslCrt: 'cert/https.crt',
    httpPort: 8000,
    httpsPort: 8001,
    documentRoot: '.',
    defaultFolder: '.',
    defaultFile: 'index.html',
  },
  build: {
    global: {
      target: 'es2018',
      sourcemap: true,
      format: 'esm',
      banner: { js: '/*\n  generated by @vladmandic/build  \n*/\n' },
      bundle: true,
      platform: 'browser',
      treeShaking: true,
      ignoreAnnotations: false,
    },
    production: {
      minify: true,
    },
    development: {
      minify: false,
    },
    targets: [],
  },
  typescript: {
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
    allowUnreachableCode: false,
    allowUnusedLabels: false,
    alwaysStrict: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    noFallthroughCasesInSwitch: true,
    noImplicitAny: false,
    noImplicitOverride: true,
    noImplicitReturns: true,
    noImplicitThis: true,
    noPropertyAccessFromIndexSignature: false,
    noUncheckedIndexedAccess: false,
    noUnusedLocals: false,
    noUnusedParameters: true,
    preserveConstEnums: true,
    strictBindCallApply: true,
    strictFunctionTypes: true,
    strictNullChecks: true,
    strictPropertyInitialization: true,
    'no-restricted-syntax': 'off',
  },
  lint: {
    locations: ['src/*.ts'],
    env: { browser: true, commonjs: true, node: true, es2020: true },
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2020 },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended'],
    ignorePatterns: ['**/dist/**', '**/typedoc/**', '**/types/**', '**/node_modules/**'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-var-requires': 'off',
      'dot-notation': 'off',
      'func-names': 'off',
      'guard-for-in': 'off',
      'import/extensions': 'off',
      'import/no-named-as-default': 'off',
      'import/prefer-default-export': 'off',
      'lines-between-class-members': 'off',
      'max-len': [1, 250, 3],
      'newline-per-chained-call': 'off',
      'no-async-promise-executor': 'off',
      'no-await-in-loop': 'off',
      'no-bitwise': 'off',
      'no-case-declarations': 'off',
      'no-continue': 'off',
      'no-plusplus': 'off',
      'object-curly-newline': 'off',
      'prefer-destructuring': 'off',
      'prefer-template': 'off',
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      radix: 'off',
      'no-underscore-dangle': 'off',
      'no-restricted-syntax': 'off',
      'no-return-assign': 'off',
    },
  },
};
