# Build

*Integrated HTTP/HTTPS server with a build platform, bundler, types/document/changelog generation and file watcher for `NodeJS`*

<br>

## Profiles

Key feature is configurable multiple build profiles each executing specified build steps  
To configure a pipeline, edit `build.json`  

**Default profiles:**

```json
  "profiles": {
    "production": ["clean", "compile", "typings", "typedoc", "lint", "changelog"],
    "development": ["serve", "watch", "compile"],
  },
```

## Profile Steps

- **`clean`**: clean locations specified in `config.clean.locations`

- **`compile`**: compile and bundle sources for each target  
  compile treats errors as non-fatal so when running with `watch` it retries once error is corrected
  optional steps `typings` and `typedoc` are skipped on unsucessful compile

- **`typings`**: generate `.d.ts` typings  
  runs for each target with `config.build.<target>.typings` set
  saves to `config.build.<target>.typings` location  
  all compiler parameters can also be overriden in `config.typescript` or in user's `tsconfig.json`  

- **`typedoc`**: generate typedoc documentation typings  
  runs for each target with `config.build.<target>.typedoc` set
  saves to `config.build.<target>.typedoc` location  
  uses same configuration parameters from `config.typescript` and user's `tsconfig.json`  
  generator parameters can also be overriden in user's `typedoc.json`  

- **`lint`**: lint locations specified in `config.lint.locations`  
  all lint parameters can also be overriden in `config.lint` or in user's `.eslintrc.json`  
  default configuration requires following peer dependencies:  
  `eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-node`

- **`changelog`**: generate changelog from git commit log  
  requires that project is a valid git repository

- **`serve`**: start http/https
  starts HTTP/HTTPS server using configuration from `config.serve`  
  server is native stream-based `NodeJS` solution without external dependencies  
  server uses compression when supported by client and provides all requires http headers  
  **SSL**: if user does not provide a valid ssl key/cert, default self-signed certificate will be used  
  self-signed certificate was generated using:

    ```shell
    openssl req -x509 -newkey rsa:4096 -nodes -days 365 \
    -keyout https.key -out https.crt \
    -subj "/C=US/ST=Florida/L=Miami/O=@vladmandic"
    ```

- **`watch`**: start file watcher for location specified in `config.watch.locations`  
  triggers `compile` step on create/modify/delete events

<br>

## Configuration

- most values have defaults to minimize required configuration  
  default configuration: <https://github.com/vladmandic/build/blob/main/build.json>  
  minimum required configuration is a single target `config.build.target`
- inherits settings from user's configuration files if they exists  
  `package.json`, `tsconfig.json`, `typedoc.json`, `.eslintrc.json`
- any configuration item can be specified  
  in a configuration file or as a configuration `config` object when using API  
  default configuration file is `build.json` 
- configuration Documentation:  
  <https://vladmandic.github.io/build/typedoc/classes/Build.html#config>

<br>

## Usage

### 1. Using Developer API

- TypeDoc API Documentation:  
  <https://vladmandic.github.io/build/typedoc/classes/Build.html>

*Example*:

```js
const Build = require('@vladmandic/build').Build;

const config = {
  profiles: { // define profile 'production' with specific build steps
    "production": ["clean", "compile", "typings", "typedoc", "lint", "changelog"],
  },
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

const result = await build.run('production');
console.log('Build results:', result);
```

<br>

### 2. Using Command Line Interface

*Example*: `npm run build --help`

```text
Usage: build [options]

Options:
  -c, --config <file>      specify config file
  -d, --debug              enable debug output
  -g, --generate           generate config files from templates
  -p, --profile <profile>  run build for specific profile
  -h, --help               display help for command
```

*Example*: `npm run build --profile production`


<br>

### 3. As a script within a project

Modify your `package.json` to include:

```json
  "scripts": {
    "dev": "build -p development",
    "prod": "build -p production",
  }
```

And then start using `npm run dev` or `npm run prod`

<br>

## Example Output

```js
2021-09-11 10:08:52 INFO:  @vladmandic/build version 0.4.1
2021-09-11 10:08:52 INFO:  User: vlado Platform: linux Arch: x64 Node: v16.5.0
2021-09-11 10:08:52 STATE: Application log: /home/vlado/dev/build/build.log
2021-09-11 10:08:52 INFO:  Application: { name: '@vladmandic/build', version: '0.4.1' }
2021-09-11 10:08:52 INFO:  Environment: { profile: 'all', config: 'build.json', tsconfig: true, eslintrc: true, git: true }
2021-09-11 10:08:52 INFO:  Toolchain: { build: '0.4.1', esbuild: '0.12.26', typescript: '4.4.3', typedoc: '0.21.9', eslint: '7.32.0' }
2021-09-11 10:08:52 INFO:  Build: { profile: 'all', steps: ['clean','compile','typings','typedoc','lint','changelog','serve','watch' ] }
2021-09-11 10:08:52 STATE: Clean: { locations: [ 'types/*', 'typedoc/*', [length]: 2 ] }
2021-09-11 10:08:52 STATE: Compile: { name: 'build module', format: 'esm', platform: 'node', input: 'src/build.js', output: 'dist/build.esm.js', files: 13, inputBytes: 39928, outputBytes: 603792 }
2021-09-11 10:08:52 STATE: Compile: { name: 'build module', format: 'cjs', platform: 'node', input: 'src/build.js', output: 'dist/build.js', files: 13, inputBytes: 39928, outputBytes: 604935 }
2021-09-11 10:08:54 STATE: Typings: { input: 'src/build.js', output: 'types', files: 7 }
2021-09-11 10:08:58 STATE: TypeDoc: { input: 'src/build.js', output: 'typedoc', objects: 1, index: true }
2021-09-11 10:09:00 STATE: Lint: { locations: [ 'src/*.js', [length]: 1 ], files: 12, errors: 0, warnings: 0 }
2021-09-11 10:09:00 STATE: ChangeLog: { repository: 'https://github.com/vladmandic/build', branch: 'main', output: 'CHANGELOG.md' }
2021-09-11 10:09:00 STATE: WebServer: { ssl: false, port: 8000, root: '.' }
2021-09-11 10:09:00 STATE: WebServer: { ssl: true, port: 8001, root: '.', sslKey: 'cert/https.key', sslCrt: 'cert/https.crt' }
2021-09-11 10:09:00 STATE: Watch: { locations: [ 'src/**', 'src/**', [length]: 2 ] }
2021-09-11 10:09:00 INFO:  Listening...
...
2021-09-11 10:09:11 INFO:  Watch: { event: 'modify', input: 'src/build.js' }
2021-09-11 10:09:11 STATE: Compile: { name: 'build module', format: 'esm', platform: 'node', input: 'src/build.js', output: 'dist/build.esm.js', files: 13, inputBytes: 39928, outputBytes: 603792 }
2021-09-11 10:09:11 STATE: Compile: { name: 'build module', format: 'cjs', platform: 'node', input: 'src/build.js', output: 'dist/build.js', files: 13, inputBytes: 39928, outputBytes: 604935 }
2021-09-11 10:09:13 STATE: Typings: { input: 'src/build.js', output: 'types', files: 7 }
2021-09-11 10:09:14 STATE: TypeDoc: { input: 'src/build.js', output: 'typedoc', objects: 1, index: true }
...
2021-09-11 10:09:17 DATA:  HTTPS: { method: 'GET', ver: '2.0', status: 200, mime: 'text/html', size: 3560, url: '/typedoc/index.html', remote: '::ffff:192.168.0.200' }
2021-09-11 10:09:17 DATA:  HTTPS: { method: 'GET', ver: '2.0', status: 200, mime: 'text/css', size: 72023, url: '/typedoc/assets/css/main.css', remote: '::ffff:192.168.0.200' }
2021-09-11 10:09:17 DATA:  HTTPS: { method: 'GET', ver: '2.0', status: 200, mime: 'text/javascript', size: 155546, url: '/typedoc/assets/js/main.js', remote: '::ffff:192.168.0.200' }
...
2021-09-11 10:09:22 INFO:  Build exiting...
```

<br>

## Rebuilding Build Module

Since `Build` is written in TypeScript, it needs to be bootstrapped into JavaScript bundle before it can be used  
Simply run `npm run bootstrap` which will create `dist/build.js`

## TypeDoc Documentation

<https://vladmandic.github.io/build/typedoc/index.html>
