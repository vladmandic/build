import type { Config, Targets, Steps } from './interfaces';
export { Config, Targets, Steps } from './interfaces';
/**
 * Class Build
 */
export declare class Build {
    /**
     * Command line params when used in Cli mode
     */
    params: {
        debug: boolean;
        config: string;
        generate: boolean;
        profile: string;
    };
    /**
     * Contains version strings of all build tools
     * @property `build` semver version string
     * @property `esbuild` semver version string
     * @property `typescript` semver version string
     * @property `typedoc` semver version string
     * @property `eslint` semver version string
     */
    toolchain: {
        build: string;
        esbuild: string;
        typescript: string;
        typedoc: string;
        eslint: string;
    };
    /**
     * Contains detected available configuration
     * @property `config` name of the parsed config file
     * @property `tsconfig` is `tsconfig.json` present?
     * @property `eslintrc` is `eslintrc.json` present?
     * @property `git` is this a valid git repository?
     */
    environment: {
        config: string | undefined;
        package: string | undefined;
        tsconfig: boolean;
        eslintrc: boolean;
        git: boolean;
    };
    /**
     * Contains detected application information
     * @property `name` application name
     * @property `version` application version
     */
    application: {
        name: string;
        version: string;
    };
    /**
     * Contains parsed application package.json file
     */
    package: Record<string, unknown>;
    /**
     * Contains currently active build configuration
     *
     * Configuration is combined from:
     * - Build defaults
     * - Parsing optional `build.json` or user specified config file
     * - Parsing optional `tsconfig.json`
     * - Parsing optional `eslintrc.json`
     * - Parsing optional `typedoc.json`
     *
     * @property `log` control build logging
     * @property `clean` control location cleaning at the beggining of build process
     * @property `lint` configuration for project linting
     * @property `changelog` configuration for changelog generation
     * @property `build` configuration for project build step and all individual targets which includes: **build**, **bundle**, **typedoc**, **typings**
     * @property `serve` configuration for http/https web server used in dev build profile
     * @property `watch` configuration for file/folder watcher used in dev build profile
     * @property `typescript` override compiler configuration for typescript
     */
    config: Config;
    /**
     * Initializes Build class with all parsed configurations
     *
     * @param config {@link Config} Optional configuration options overrides
     */
    constructor(config?: Partial<Config>);
    updateConfig: (config: any, options?: {}) => any;
    packageJson: () => any;
    /**
     * Runs build pipeline for specified profile
     *
     * @param profile Profile type, e.g. "production" or "development"
     * @param config {@link Config} Optional configuration options overrides
     * @returns Object containing all messages
     */
    run(profile: string, config?: Partial<Config>): Promise<{}>;
    clean(): Promise<void>;
    lint(): Promise<void>;
    changelog(): Promise<void>;
    serve(): Promise<string[]>;
    compile(steps: Array<Steps>): Promise<void>;
    watch(steps: Array<Steps>): Promise<unknown>;
    typings(target: Targets): Promise<void>;
    typedoc(target: Targets): Promise<void>;
}
