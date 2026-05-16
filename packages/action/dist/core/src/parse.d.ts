import { type Flag } from './schema.js';
export declare class FlagParseError extends Error {
    readonly source: string;
    readonly issues: string[];
    constructor(source: string, issues: string[]);
}
export declare function parseFlagYaml(yaml: string, source?: string): Flag;
//# sourceMappingURL=parse.d.ts.map