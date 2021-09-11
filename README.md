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
    "development": ["serve", "watch", "compile"]
  },
```

## Profile Steps

- **`clean`**: clean locations specified in `config.clean.locations`

- **`compile`**: compile and bundle sources for each target

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

```log
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
