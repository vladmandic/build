# Build

*Integrated HTTP/HTTPS server with a build platform, bundler, types/document/changelog generation and file watcher for `NodeJS`*

<br>

## Core Profiles

- **Production**: Runs production build and documentation
- **Development**: Runs development build in watch mode

Each execution step of the profiles is configurable

<br>

## Configuration

- Uses default values to minimize required configuration: no configuration files are needed  
  Default configuration: <https://github.com/vladmandic/build/blob/main/build.json>
- Inherits defaults from user's `tsconfig.json`, `typedoc.json`, `.eslintrc.json`
- All configuration values can be overriden
- Can be specified in `build.json` or as an object when using API
- Configuration Documentation:  
  <https://vladmandic.github.io/build/typedoc/classes/Build.html#config>

<br>

## Usage

### Using Developer API

- TypeDoc API Documentation:  
  <https://vladmandic.github.io/build/typedoc/classes/Build.html>

Example:

```js
const Build = require('@vladmandic/build').Build;

const config = {
  build: {
    targets: [ // minimum configuration requires at least one target
      { input: "src/test.ts", output: "dist/test.js", platform: "node", format: "cjs", typedoc: 'typedoc', typings: 'types' }
    ]
  }
}
const build = new Build(config);

console.log('Toolchain', build.toolchain);
console.log('Environment', build.environment);
console.log('Application', build.application);
console.log('Configuration', build.config);

const result = await build.production();
console.log('Build results:', result);
```

<br>

### Using Command Line Interface

Example: `npm run build`

```log
Usage: build [options] [command]

Options:
  -c, --config <file>  specify config file
  -d, --debug          enable debug output
  -g, --generate       generate config files from templates
  -h, --help           display help for command

Commands:
  development          start development ci
  production           start production build
  config               show active configuration and exit
  help [command]       display help for command
```

<br>

### As a script within a project

Modify your `package.json` to include:

```json
  "scripts": {
    "dev": "build development",
    "prod": "build production",
  }
```

<br>

## Production Profile

- Clean locations
- Build JS bundles from TS or JS sources with multiple profiles and targets
- Run Linter
- Generate .d.ts typings using TypeScript
- Generate TypeDoc documentation
- Generate ChangeLog from Git commits

Example: `npm run build production`

```js
2021-09-09 12:01:39 INFO:  @vladmandic/build version 0.3.1
2021-09-09 12:01:39 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.8.0
2021-09-09 12:01:39 INFO:  Application: { name: '@vladmandic/build', version: '0.3.1' }
2021-09-09 12:01:39 INFO:  Environment: { profile: 'production', config: 'build.json', tsconfig: true, eslintrc: true, git: true }
2021-09-09 12:01:39 INFO:  Toolchain: { build: '0.3.1', esbuild: '0.12.25', typescript: '4.4.2', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-09 12:01:39 STATE: Clean: { locations: [ 'test/dist/*', 'types/*', 'typedoc/*', [length]: 3 ] }
2021-09-09 12:01:39 STATE: Build: { type: 'production', format: 'cjs', platform: 'node', input: 'src/build.js', output: 'test/dist/build.js', files: 12, inputBytes: 34587, outputBytes: 593571 }
2021-09-09 12:01:40 STATE: Typings: { input: 'src/build.js', output: 'types', files: 7 }
2021-09-09 12:01:45 STATE: TypeDoc: { input: 'src/build.js', output: 'typedoc', objects: 2, index: true }
2021-09-09 12:01:45 STATE: Build: { type: 'production', format: 'esm', platform: 'browser', input: 'test/src/index.ts', output: 'test/dist/index.esm.js', files: 2, inputBytes: 503, outputBytes: 377 }
2021-09-09 12:01:45 STATE: Build: { type: 'production', format: 'cjs', platform: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 845 }
2021-09-09 12:01:46 STATE: Lint: { locations: [ 'src/*', 'test/src/*', [length]: 2 ], files: 12, errors: 0, warnings: 0 }
2021-09-09 12:01:46 STATE: ChangeLog: { repository: 'https://github.com/vladmandic/build', branch: 'main', output: 'CHANGELOG.md' }
2021-09-09 12:01:46 INFO:  Profile production done
```

## Development Profile

- Start HTTP and HTTPS web server
- Run in file watch mode
- Build JS bundles from TS or JS sources with multiple profiles and targets on demand

Example: `npm run build development`

```js
2021-09-09 10:15:10 INFO:  @vladmandic/build version 0.3.1
2021-09-09 10:15:10 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.8.0
2021-09-09 10:15:10 INFO:  Application: { name: '@vladmandic/build', version: '0.3.1' }
2021-09-09 10:15:10 INFO:  Environment: { profile: 'development', config: 'build.json', tsconfig: true, eslintrc: true, git: true }
2021-09-09 10:15:10 INFO:  Toolchain: { esbuild: '0.12.25', typescript: '4.4.2', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-09 10:15:10 STATE: WebServer: { ssl: false, port: 8000, root: '.' }
2021-09-09 10:15:10 STATE: WebServer: { ssl: true, port: 8001, root: '.', sslKey: 'cert/https.key', sslCrt: 'cert/https.crt' }
2021-09-09 10:15:10 STATE: Watch: { locations: [ 'test/src/**', 'test/src/**', [length]: 2 ] }
2021-09-09 10:15:10 STATE: Build: { type: 'development', format: 'cjs', platform: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 845 }
2021-09-09 10:15:24 INFO:  Watch: { event: 'modify', input: 'test/src/index.ts' }
2021-09-09 10:15:24 STATE: Build: { type: 'development', format: 'cjs', platform: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 845 }
2021-09-09 10:15:31 INFO:  Build exiting...
```

<br><hr><br>

## Modules

### Clean

- Cleans locations found in `config.clean.locations`

### Lint

- Uses `ESLint` with default configuration found in `config.lint` section plus overrides from local `.eslintrc.json`

Modules required by default configuration:

```shell
npm install eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-node
```

### ChangeLog

- Uses `Git` to generate application change log

### WebServer

- Run HTTP/HTTPS server from `config.documentRoot`
- Web server is native stream-based `NodeJS` solution without external dependencies
- SSL
  - Some apps do not work without secure server since browsers enfoce ssl for access to navigator object
  - You can provide your server key and certificate or use provided self-signed ones  
    Self-signed certificate was generated using:

    ```shell
    openssl req -x509 -newkey rsa:4096 -nodes -keyout https.key -out https.crt -days 365 \
    -subj "/C=US/ST=Florida/L=Miami/O=@vladmandic"
    ```

### Compile & Bundle

- Run build & bundle using `ESLint`  
  for all entries in `config.build.targets`
  with settings combined from `config.build.global`, `config.build.<profile>` and `config.build.targets.<entry>`

### Typings

- Generate `d.ts` typings using `TSC`  
  using settings from optional `tsconfig.json` merged with `config.typescript`
- Note: This step serves as additional rules enforcement in addition to `Lint`
- Runs for each target entry that has `typings` field pointing to `output` directory

### TypeDoc

- Generate documentation using `typedoc`
  using settings from optional `tsconfig.json:typedocOptions` or `typedoc.json`
- Runs for each target entry that has `typedoc` field pointing to `output` directory

## Generate

- Generates templates for `tsconfig.json`, `.eslintrc.json` and `typedoc.json`
- Only available when combined with `production` profile
- If files already exists, it will not overwrite them
- *WARNING*: Check and edit as needed before using
