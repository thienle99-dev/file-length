import * as vscode from 'vscode';
import * as fs from 'fs';
import { getCommentRegex, isCodeFile, shouldIgnorePath } from './utils';

export class LineCountService {
    // Cache: URI -> LineCount
    private cache = new Map<string, number>();
    private config = vscode.workspace.getConfiguration('lineCount');

    constructor() {
        this.updateConfig();
    }

    public updateConfig() {
        this.config = vscode.workspace.getConfiguration('lineCount');
    }

    /**
     * Re-computes line count for a URI. 
     * Uses a fast async read.
     */
    public async computeLineCount(uri: vscode.Uri): Promise<number | undefined> {
        if (!this.config.get('enabled')) return undefined;

        const filePath = uri.fsPath;

        // 1. Skip ignored directories
        if (shouldIgnorePath(filePath)) return undefined;

        // 2. Only count code files
        if (!isCodeFile(filePath)) return undefined;

        // Skip binary/large files (threshold: 10MB)
        try {
            const stats = await vscode.workspace.fs.stat(uri);
            if (stats.size > 10 * 1024 * 1024) return undefined;
            if (stats.type === vscode.FileType.Directory) return undefined;
        } catch {
            return undefined;
        }

        try {
            const contentBuffer = await vscode.workspace.fs.readFile(uri);
            let text = contentBuffer.toString();

            // 1. Optional: Strip comments
            if (this.config.get('ignoreComments')) {
                const regex = getCommentRegex(uri.fsPath);
                if (regex) {
                    text = text.replace(regex, '');
                }
            }

            // 2. Count lines
            let lines = text.split(/\r?\n/);

            // 3. Optional: Filter empty lines
            if (this.config.get('showOnlyNonEmptyLines')) {
                lines = lines.filter((line: string) => line.trim().length > 0);
            }

            const count = lines.length;
            this.cache.set(uri.toString(), count);
            return count;
        } catch (e) {
            return undefined;
        }
    }

    public getCachedCount(uri: vscode.Uri): number | undefined {
        return this.cache.get(uri.toString());
    }

    public invalidate(uri: vscode.Uri) {
        this.cache.delete(uri.toString());
    }

    public clearCache() {
        this.cache.clear();
    }
}
