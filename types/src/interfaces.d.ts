export declare type Steps = 'clean' | 'lint' | 'compile' | 'changelog' | 'serve' | 'watch' | 'typings' | 'typedoc';
export interface Targets {
    name: string;
    input: string;
    output: string;
    [key: string]: unknown;
}
export interface Config {
    log: {
        enabled: boolean;
        console: boolean;
        output: string;
        debug: boolean;
    };
    profiles: Record<string, Array<Steps>>;
    watch: {
        locations: string[];
    };
    clean: {
        locations: string[];
    };
    changelog: {
        output: string;
    };
    serve: {
        sslKey: string;
        sslCrt: string;
        httpPort: number;
        httpsPort: number;
        documentRoot: string;
        defaultFolder: string;
        defaultFile: string;
    };
    build: {
        global: Record<string, unknown>;
        targets: Array<Targets>;
        [key: string]: unknown;
    };
    typescript: Record<string, unknown>;
}
