import * as vscode from 'vscode';
import { getCommentRegex, isCodeFile, shouldIgnorePath, LRUCache } from './utils';

interface CacheEntry {
    count: number;
    mtime: number;
}

export class LineCountService {
    private cache = new LRUCache<CacheEntry>(5000);
    private config = vscode.workspace.getConfiguration('lineCount');

    constructor() {
        this.updateConfig();
    }

    public updateConfig() {
        this.config = vscode.workspace.getConfiguration('lineCount');
    }

    /**
     * Re-computes line count for a URI. 
     * Uses mtime to avoid redundant reads.
     */
    public async computeLineCount(uri: vscode.Uri): Promise<number | undefined> {
        if (!this.config.get('enabled')) return undefined;

        const filePath = uri.fsPath;
        if (shouldIgnorePath(filePath)) return undefined;
        if (!isCodeFile(filePath)) return undefined;

        try {
            const stats = await vscode.workspace.fs.stat(uri);
            if (stats.size > 10 * 1024 * 1024) return undefined;
            if (stats.type === vscode.FileType.Directory) return undefined;

            // Check cache with mtime validation
            const cached = this.cache.get(uri.toString());
            if (cached && cached.mtime === stats.mtime) {
                return cached.count;
            }

            // Only read and parse if mtime changed or not in cache
            const contentBuffer = await vscode.workspace.fs.readFile(uri);
            let text = contentBuffer.toString();

            if (this.config.get('ignoreComments')) {
                const regex = getCommentRegex(uri.fsPath);
                if (regex) text = text.replace(regex, '');
            }

            let lines = text.split(/\r?\n/);
            if (this.config.get('showOnlyNonEmptyLines')) {
                lines = lines.filter((line: string) => line.trim().length > 0);
            }

            const count = lines.length;
            this.cache.set(uri.toString(), { count, mtime: stats.mtime });
            return count;
        } catch {
            return undefined;
        }
    }

    public getCachedCount(uri: vscode.Uri): number | undefined {
        return this.cache.get(uri.toString())?.count;
    }

    public invalidate(uri: vscode.Uri) {
        this.cache.delete(uri.toString());
    }

    public clearCache() {
        this.cache.clear();
    }
}

