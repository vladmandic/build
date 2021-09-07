# Dev-Server: Integrated HTTP/HTTPS server with a build platform and file watcher

## Built-in Profiles

- **Production**: Runs production build and documentation
- **Development**: Runs development build in watch mode

Each execution step of the profile is configurable

<br>

## Production Profile

1. Lint project
2. Clean locations
3. Build using production settings
4. Generate typings
5. Generate type docs
6. Generate change log

Example: `npm run build production`

```js
2021-09-07 13:54:17 INFO:  build version 0.0.1
2021-09-07 13:54:17 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.8.0
2021-09-07 13:54:17 INFO:  Toolchain: { esbuild: '0.12.25', typescript: '4.4.2', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-07 13:54:17 INFO:  Environment: { profile: 'production', tsconfig: true, eslintrc: true, git: true }
2021-09-07 13:54:18 STATE: Lint: { locations: [ 'test/src/*.ts', [length]: 1 ], files: 2, errors: 0, warnings: 0 }
2021-09-07 13:54:18 STATE: Clean: { locations: [ 'test/dist/*', 'test/types/*', 'test/typedoc/*', [length]: 3 ] }
2021-09-07 13:54:18 STATE: Build: { type: 'production', target: 'browser', input: 'test/src/index.ts', output: 'test/dist/index.esm.js', files: 2, inputBytes: 503, outputBytes: 240 }
2021-09-07 13:54:18 STATE: Build: { type: 'production', target: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 241 }
2021-09-07 13:54:18 STATE: Typings: { input: 'test/src/index.ts', output: 'test/typings', files: 2 }
2021-09-07 13:54:21 STATE: TypeDoc: { input: 'test/src/index.ts', output: 'test/typedoc', objects: 3 }
2021-09-07 13:54:21 STATE: ChangeLog: { repository: 'https://github.com/vladmandic/build', output: 'CHANGELOG.md' }
2021-09-07 13:54:21 INFO:  Profile production done
```

## Development Profile

1. Start web server
2. Run in watch mode
3. Build using development settings

Example: `npm run build development`

```js
2021-09-07 13:53:02 INFO:  build version 0.0.1
2021-09-07 13:53:02 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.8.0
2021-09-07 13:53:02 INFO:  Toolchain: { esbuild: '0.12.25', typescript: '4.4.2', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-07 13:53:02 INFO:  Environment: { profile: 'development', tsconfig: true, eslintrc: true, git: true }
2021-09-07 13:53:02 STATE: WebServer: { ssl: false, port: 8000, root: '.' }
2021-09-07 13:53:02 STATE: WebServer: { ssl: true, port: 8001, root: '.', sslKey: 'cert/https.key', sslCrt: 'cert/https.crt' }
2021-09-07 13:53:02 STATE: Watch: { locations: [ 'test/src/**', [length]: 1 ] }
2021-09-07 13:53:02 STATE: Build: { type: 'development', target: 'browser', input: 'test/src/index.ts', output: 'test/dist/index.esm.js', files: 2, inputBytes: 503, outputBytes: 379 }
2021-09-07 13:53:02 STATE: Build: { type: 'development', target: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 380 }
2021-09-07 13:53:08 INFO:  Watch: { event: 'modify', input: 'test/src/module.ts' }
2021-09-07 13:53:08 STATE: Build: { type: 'development', target: 'browser', input: 'test/src/index.ts', output: 'test/dist/index.esm.js', files: 2, inputBytes: 503, outputBytes: 379 }
2021-09-07 13:53:08 STATE: Build: { type: 'development', target: 'node', input: 'test/src/index.ts', output: 'test/dist/index.node.js', files: 2, inputBytes: 503, outputBytes: 380 }
.
.
.
2021-09-07 13:53:28 INFO:  Build exiting...
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

### Build

- Run build & bundle using `ESLint`  
  for all entries in both `browser` and `node` targets
  with settings combined from `config.global` and `config.<profile>`

### Typings

- Generate `d.ts` typings using `TSC`  
  using settings from optional `tsconfig.json` merged with `config.typescript`
- Note: This step serves as additional rules enforcement in addition to `Lint`

### TypeDoc

- Generate documentation using `typedoc`
  using settings from optional `tsconfig.json:typedocOptions` or `typedoc.json`
