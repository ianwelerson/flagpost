export interface CommitOptions {
    message: string;
    authorName: string;
    authorEmail: string;
    files: string[];
}
export declare function configureGit(name: string, email: string): Promise<void>;
export declare function hasChanges(files: string[]): Promise<boolean>;
export declare function commitAndPush(opts: CommitOptions): Promise<void>;
//# sourceMappingURL=git.d.ts.map