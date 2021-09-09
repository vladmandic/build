export class Build {
    /**
     * Initializes Build class with all parsed configurations
     *
     * @param options  Optional configuration options overrides
     */
    constructor(options?: {});
    /**
     * Command line params when used in Cli mode
     */
    params: {
        debug: boolean;
        config: string;
    };
    /**
     * Contains version strings of all build tools
     * @typedef {object} Toolchain
     * @property {string} esbuild semver version string
     * @property {string} typescript semver version string
     * @property {string} typedoc semver version string
     * @property {string} eslint semver version string
     * @type {Toolchain}
     */
    toolchain: {
        esbuild: string;
        typescript: string;
        typedoc: string;
        eslint: string;
    };
    /**
     * Contains detected available configuration
     * @typedef {object} Environment
     * @property {string} config name of the parsed config file
     * @property {boolean} tsconfig is `tsconfig.json` present?
     * @property {boolean} eslintrc is `eslintrc.json` present?
     * @property {boolean} git is this a valid git repository?
     * @type {Environment}
     */
    environment: {
        config: string;
        tsconfig: boolean;
        eslintrc: boolean;
        git: boolean;
    };
    /**
     * Contains detected application information
     * @typedef {object} Application
     * @property {string} name application name
     * @property {string} version application version
     * @type {Environment}
     */
    application: {
        name: string;
        version: string;
    };
    /**
     * Contains parsed application package.json file
     * @typedef {object} PackageJson
     * @type {PackageJson}
     */
    package: {};
    /**
     * Contains currently active build configuration
     *
     * Configuration is combined from:
     * - Build defaults
     * - Parsing mandatory `build.json`
     * - Parsing optional `tsconfig.json`
     * - Parsing optional `eslintrc.json`
     * - Parsing optional `typedoc.json`
     * @typedef {object} Config
     * @type {Config}
     */
    config: {
        debug: boolean;
        log: {
            enabled: boolean;
            output: string;
        };
        clean: {
            enabled: boolean;
            locations: string[];
        };
        lint: {
            enabled: boolean;
            locations: string[];
            rules: {};
        };
        changelog: {
            enabled: boolean;
            output: string;
        };
        serve: {
            enabled: boolean;
            sslKey: string;
            sslCrt: string;
            httpPort: number;
            httpsPort: number;
            documentRoot: string;
            defaultFolder: string;
            defaultFile: string;
        };
        build: {
            enabled: boolean;
            global: {
                target: string;
                sourcemap: boolean;
                banner: {
                    js: string;
                };
            };
            production: {
                minify: boolean;
            };
            development: {
                minify: boolean;
            };
            targets: ({
                input: string;
                output: string;
                platform: string;
                format: string;
                typings: string;
                typedoc: string;
                external: string[];
            } | {
                input: string;
                output: string;
                platform: string;
                format: string;
                external: never[];
                typings?: undefined;
                typedoc?: undefined;
            })[];
        };
        watch: {
            enabled: boolean;
            locations: string[];
        };
        typescript: {
            allowUnreachableCode: boolean;
            allowUnusedLabels: boolean;
            alwaysStrict: boolean;
            emitDecoratorMetadata: boolean;
            experimentalDecorators: boolean;
            noFallthroughCasesInSwitch: boolean;
            noImplicitAny: boolean;
            noImplicitOverride: boolean;
            noImplicitReturns: boolean;
            noImplicitThis: boolean;
            noPropertyAccessFromIndexSignature: boolean;
            noUncheckedIndexedAccess: boolean;
            noUnusedLocals: boolean;
            noUnusedParameters: boolean;
            preserveConstEnums: boolean;
            resolveJsonModule: boolean;
            strictBindCallApply: boolean;
            strictFunctionTypes: boolean;
            strictNullChecks: boolean;
            strictPropertyInitialization: boolean;
        };
    };
    /**
     * Runs build pipeline for development profile
     *
     * @param options  optional configuration options overrides
     */
    development(options?: {}): Promise<void>;
    /**
     * Runs build pipeline for production profile
     *
     * @param options  optional configuration options overrides
     */
    production(options?: {}): Promise<void>;
    /**
     * Runs build pipeline for specified profile
     *
     * @param profile  profile type: <"production" | "development">
     * @param options  optional configuration options overrides
     */
    build(profile?: string, options?: {}): void;
    /**
     * Runs build in cli mode
     *
     * Usage: build [options] [command]
     *
     * **Options:**
     * - `-c`, `--config` `<file>`  specify alternative config file
     * - `-d`, `--debug`            enable debug output
     * - `-h`, `--help`             display help for command
     *
     * **Commands:**
     * - `development`          start development ci
     * - `production`           start production build
     * - `config`               show active configuration and exit
     * - `help [command]`       display help for command
     */
    cli(): void;
}
export { version };
