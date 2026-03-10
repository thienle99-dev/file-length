import * as vscode from 'vscode';
import { getCommentRegex, isCodeFile, shouldIgnorePath, LRUCache, calculateComplexity } from './utils';

interface CacheEntry {
    count: number;
    mtime: number;
    complexity?: { score: number, level: 'low' | 'medium' | 'high' };
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
     * Re-computes line count and complexity for a URI. 
     * Uses mtime to avoid redundant reads.
     */
    public async computeLineCount(uri: vscode.Uri): Promise<CacheEntry | undefined> {
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
                return cached;
            }

            // Only read and parse if mtime changed or not in cache
            const contentBuffer = await vscode.workspace.fs.readFile(uri);
            const text = contentBuffer.toString();
            let processedText = text;

            if (this.config.get('ignoreComments')) {
                const regex = getCommentRegex(uri.fsPath);
                if (regex) processedText = processedText.replace(regex, '');
            }

            let lines = processedText.split(/\r?\n/);
            if (this.config.get('showOnlyNonEmptyLines')) {
                lines = lines.filter((line: string) => line.trim().length > 0);
            }

            const count = lines.length;
            const complexity = this.config.get('showComplexity') 
                ? calculateComplexity(text, filePath) 
                : undefined;

            const result: CacheEntry = { count, mtime: stats.mtime, complexity };
            this.cache.set(uri.toString(), result);
            return result;
        } catch {
            return undefined;
        }
    }

    public getCachedEntry(uri: vscode.Uri): CacheEntry | undefined {
        return this.cache.get(uri.toString());
    }

    public invalidate(uri: vscode.Uri) {
        this.cache.delete(uri.toString());
    }

    public clearCache() {
        this.cache.clear();
    }
}


