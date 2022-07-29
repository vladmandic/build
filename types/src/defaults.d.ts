export declare const defaults: {
    log: {
        enabled: boolean;
        debug: boolean;
        console: boolean;
        output: string;
    };
    profiles: {
        production: string[];
        development: string[];
        lint: string[];
        all: string[];
    };
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
        cors: boolean;
    };
    build: {
        global: {
            target: string;
            sourcemap: boolean;
            format: string;
            banner: {
                js: string;
            };
            bundle: boolean;
            platform: string;
            treeShaking: boolean;
            legalComments: string;
            ignoreAnnotations: boolean;
        };
        production: {
            minify: boolean;
        };
        development: {
            minify: boolean;
        };
        targets: never[];
    };
    typescript: {
        module: string;
        target: string;
        typeRoots: string[];
        lib: string[];
        baseUrl: string;
        paths: {
            tslib: string[];
        };
        sourceMap: boolean;
        noEmitOnError: boolean;
        emitDeclarationOnly: boolean;
        declaration: boolean;
        allowJs: boolean;
        allowSyntheticDefaultImports: boolean;
        importHelpers: boolean;
        pretty: boolean;
        removeComments: boolean;
        skipLibCheck: boolean;
        listEmittedFiles: boolean;
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
        strictBindCallApply: boolean;
        strictFunctionTypes: boolean;
        strictNullChecks: boolean;
        strictPropertyInitialization: boolean;
        'no-restricted-syntax': string;
    };
    lint: {
        locations: string[];
        env: {
            browser: boolean;
            commonjs: boolean;
            node: boolean;
            es2020: boolean;
        };
        parser: string;
        parserOptions: {
            ecmaVersion: number;
        };
        plugins: string[];
        extends: string[];
        ignorePatterns: string[];
        rules: {
            '@typescript-eslint/ban-ts-comment': string;
            '@typescript-eslint/explicit-module-boundary-types': string;
            '@typescript-eslint/no-shadow': string;
            '@typescript-eslint/no-var-requires': string;
            'dot-notation': string;
            'func-names': string;
            'guard-for-in': string;
            'import/extensions': string;
            'import/no-named-as-default': string;
            'import/prefer-default-export': string;
            'lines-between-class-members': string;
            'max-len': number[];
            'newline-per-chained-call': string;
            'no-async-promise-executor': string;
            'no-await-in-loop': string;
            'no-bitwise': string;
            'no-case-declarations': string;
            'no-continue': string;
            'no-plusplus': string;
            'object-curly-newline': string;
            'prefer-destructuring': string;
            'prefer-template': string;
            'promise/always-return': string;
            'promise/catch-or-return': string;
            radix: string;
            'no-underscore-dangle': string;
            'no-restricted-syntax': string;
            'no-return-assign': string;
        };
    };
};
