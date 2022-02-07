import { Config, Targets, Steps } from './interfaces';
export { Config, Targets, Steps } from './interfaces';
export declare class Build {
    params: {
        debug: boolean;
        config: string;
        generate: boolean;
        profile: string;
    };
    toolchain: {
        build: string;
        esbuild: string;
        typescript: string;
        typedoc: string;
        eslint: string;
    };
    environment: {
        config: string | undefined;
        package: string | undefined;
        tsconfig: boolean;
        eslintrc: boolean;
        git: boolean;
    };
    application: {
        name: string;
        version: string;
    };
    package: Record<string, unknown>;
    config: Config;
    constructor(config?: Partial<Config>);
    updateConfig: (config: any, options?: {}) => any;
    packageJson: () => any;
    run(profile: string, config?: Partial<Config>): Promise<{}>;
    clean(): Promise<void>;
    lint(): Promise<void>;
    changelog(): Promise<void>;
    serve(): Promise<void>;
    compile(steps: Array<Steps>): Promise<void>;
    watch(steps: Array<Steps>): Promise<unknown>;
    typings(target: Targets): Promise<void>;
    typedoc(target: Targets): Promise<void>;
}
