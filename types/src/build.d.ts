import { Config, Targets, Steps } from './interfaces';
export { Config, Targets, Steps } from './interfaces';
declare const packageJson: () => any;
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
        config: string;
        tsconfig: boolean;
        eslintrc: boolean;
        git: boolean;
    };
    application: {
        name: string;
        version: string;
    };
    package: typeof packageJson;
    config: Config;
    constructor(config?: Partial<Config>);
    run(profile: string, config?: Partial<Config>): Promise<Record<string, unknown>[]>;
    clean(): Promise<void>;
    lint(): Promise<void>;
    changelog(): Promise<void>;
    serve(): Promise<void>;
    compile(steps: Array<Steps>): Promise<void>;
    watch(steps: Array<Steps>): Promise<unknown>;
    typings(target: Targets): Promise<void>;
    typedoc(target: Targets): Promise<void>;
}
