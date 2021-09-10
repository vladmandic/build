export function merge(...objects: any[]): any;
export function info(type: any, application: any, environment: any, toolchain: any): void;
export function results(): {
    msg: any;
    facility: string;
    level: any;
}[];
