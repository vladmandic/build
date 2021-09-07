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

## Development Profile

1. Start web server
2. Run in watch mode
3. Build using development settings

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

## Typings

- Generate `d.ts` typings using `TSC`  
  using settings from optional `tsconfig.json` merged with `config.typescript`
- Note: This step serves as additional rules enforcement in addition to `Lint`

## Todo

- build banner
