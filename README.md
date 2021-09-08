# Build

*Integrated HTTP/HTTPS server with a build platform, types/document/changelog generation and file watcher*

<br>

## Core Profiles

- **Production**: Runs production build and documentation
- **Development**: Runs development build in watch mode

Each execution step of the profiles is configurable

<br>

## Production Profile

- Clean locations
- Build JS bundles from TS or JS sources with multiple profiles and targets
- Run Linter
- Generate .d.ts typings
- Generate TypeDoc documentation
- Generate ChangeLog from Git commits

Example: `npm run build production`

```js
2021-09-08 13:17:20 INFO:  @vladmandic/build version 0.1.1
2021-09-08 13:17:20 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.8.0
2021-09-08 13:17:20 INFO:  Application: { name: '@vladmandic/build', version: '0.1.1' }
2021-09-08 13:17:20 INFO:  Environment: { profile: 'production', config: 'build.json', tsconfig: true, eslintrc: true, git: true }
2021-09-08 13:17:20 INFO:  Toolchain: { esbuild: '0.12.25', typescript: '4.4.2', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-08 13:17:20 STATE: Clean: { locations: [ 'test/dist/*', 'test/types/*', 'test/typedoc/*', [length]: 3 ] }
2021-09-08 13:17:20 STATE: Build: { type: 'production', format: 'esm', platform: 'browser', input: 'test/src/index.ts', output: 'test/dist/index.esm.js', files: 2, inputBytes: 503, outputBytes: 377 }
2021-09-08 13:17:20 STATE: Build: { type: 'production', format: 'cjs', platform: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 845 }
2021-09-08 13:17:20 STATE: Typings: { input: 'test/src/index.ts', output: 'test/typings', files: 2 }
2021-09-08 13:17:23 STATE: TypeDoc: { input: 'test/src/index.ts', output: 'test/typedoc', objects: 3 }
2021-09-08 13:17:24 STATE: Lint: { locations: [ 'test/src/*.ts', [length]: 1 ], files: 2, errors: 0, warnings: 0 }
2021-09-08 13:17:24 STATE: ChangeLog: { repository: 'https://github.com/vladmandic/build', output: 'CHANGELOG.md' }
2021-09-08 13:17:24 INFO:  Profile production done
```

## Development Profile

- Start HTTP and HTTPS web server
- Run in file watch mode
- Build JS bundles from TS or JS sources with multiple profiles and targets on demand

Example: `npm run build development`

```js
2021-09-08 13:16:44 INFO:  @vladmandic/build version 0.1.1
2021-09-08 13:16:44 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.8.0
2021-09-08 13:16:44 INFO:  Application: { name: '@vladmandic/build', version: '0.1.1' }
2021-09-08 13:16:44 INFO:  Environment: { profile: 'development', config: 'build.json', tsconfig: true, eslintrc: true, git: true }
2021-09-08 13:16:44 INFO:  Toolchain: { esbuild: '0.12.25', typescript: '4.4.2', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-08 13:16:44 STATE: WebServer: { ssl: false, port: 8000, root: '.' }
2021-09-08 13:16:44 STATE: WebServer: { ssl: true, port: 8001, root: '.', sslKey: 'cert/https.key', sslCrt: 'cert/https.crt' }
2021-09-08 13:16:44 STATE: Watch: { locations: [ 'test/src/**', 'test/src/**', [length]: 2 ] }
2021-09-08 13:16:44 STATE: Build: { type: 'development', format: 'esm', platform: 'browser', input: 'test/src/index.ts', output: 'test/dist/index.esm.js', files: 2, inputBytes: 503, outputBytes: 377 }
2021-09-08 13:16:44 STATE: Build: { type: 'development', format: 'cjs', platform: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 845 }
.
.
2021-09-08 13:16:50 INFO:  Build exiting...
```

<br><hr><br>

## Modules

### Clean

- Cleans locations found in `config.clean.locations`

### Lint

- Uses `ESLint` with default configuration found in `.eslintrc.json` plus overrride found in `config.lint.rules`

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
