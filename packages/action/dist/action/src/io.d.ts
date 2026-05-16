export interface FlagFile {
    /** Filename without directory (e.g. `dark-mode.yml`). */
    filename: string;
    /** Full path relative to cwd (e.g. `flags/dark-mode.yml`). */
    relPath: string;
    /** YAML contents. */
    contents: string;
}
export declare function readFlagFiles(dir: string): Promise<FlagFile[]>;
export declare function writeFileIfChanged(path: string, contents: string): Promise<boolean>;
//# sourceMappingURL=io.d.ts.map