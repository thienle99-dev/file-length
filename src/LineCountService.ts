import * as vscode from 'vscode';
import { getCommentRegex, isCodeFile, shouldIgnorePath, LRUCache, calculateComplexity } from './utils';

interface CacheEntry {
    count: number; // Final count based on settings
    codeLines: number;
    commentLines: number;
    blankLines: number;
    mtime: number;
    complexity?: { score: number, level: 'low' | 'medium' | 'high' };
    gitDelta?: number;
}

export class LineCountService {
    private cache = new LRUCache<CacheEntry>(5000);
    private baseCache = new Map<string, number>(); // URI -> Base line count (HEAD)
    private config = vscode.workspace.getConfiguration('lineCount');
    private gitApi: any;

    constructor() {
        this.updateConfig();
        this.initGitApi();
    }

    private async initGitApi() {
        try {
            const extension = vscode.extensions.getExtension('vscode.git');
            if (extension) {
                const exports = await extension.activate();
                this.gitApi = exports.getAPI(1);
            }
        } catch {}
    }

    public updateConfig() {
        this.config = vscode.workspace.getConfiguration('lineCount');
    }

    public clearCache() {
        this.cache.clear();
    }

    public clearBaseCache() {
        this.baseCache.clear();
    }

    private async getBaseLineCount(uri: vscode.Uri): Promise<number | undefined> {
        if (!this.gitApi || !this.config.get('showGitDelta')) return undefined;

        const uriString = uri.toString();
        if (this.baseCache.has(uriString)) return this.baseCache.get(uriString);

        try {
            const repository = this.gitApi.getRepository(uri);
            if (!repository) return undefined;

            const content = await repository.show('HEAD', uri.fsPath);
            if (typeof content !== 'string') return undefined;

            let finalContent = content;
            if (this.config.get('ignoreComments')) {
                const regex = getCommentRegex(uri.fsPath);
                if (regex) finalContent = finalContent.replace(regex, '');
            }

            let lines = finalContent.split(/\r?\n/);
            if (this.config.get('showOnlyNonEmptyLines')) {
                lines = lines.filter((line: string) => line.trim().length > 0);
            }

            const count = lines.length;
            this.baseCache.set(uriString, count);
            return count;
        } catch {
            return undefined;
        }
    }

    /**
     * Re-computes line count and complexity for a URI. 
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

            const contentBuffer = await vscode.workspace.fs.readFile(uri);
            const text = contentBuffer.toString();
            const rawLines = text.split(/\r?\n/);

            const commentRegex = getCommentRegex(filePath);
            const mappedLines = rawLines.map((line: string) => {
                const trimmed = line.trim();
                const isBlank = trimmed.length === 0;
                let isComment = false;
                if (!isBlank && commentRegex) {
                    const match = trimmed.match(commentRegex);
                    if (match && match[0].trim() === trimmed) {
                        isComment = true;
                    }
                }
                return { isBlank, isComment };
            });

            const blankLines = mappedLines.filter((l: { isBlank: boolean }) => l.isBlank).length;
            const commentLines = mappedLines.filter((l: { isComment: boolean }) => l.isComment).length;
            const codeLines = rawLines.length - blankLines - commentLines;

            let processedText = text;
            if (this.config.get('ignoreComments')) {
                const regex = getCommentRegex(uri.fsPath);
                if (regex) processedText = processedText.replace(regex, '');
            }

            let finalLines = processedText.split(/\r?\n/);
            if (this.config.get('showOnlyNonEmptyLines')) {
                finalLines = finalLines.filter((line: string) => line.trim().length > 0);
            }

            const count = finalLines.length;
            const complexity = this.config.get('showComplexity') 
                ? calculateComplexity(text, filePath) 
                : undefined;

            const baseCount = await this.getBaseLineCount(uri);
            const gitDelta = baseCount !== undefined ? count - baseCount : undefined;

            const result: CacheEntry = { 
                count, 
                codeLines,
                commentLines,
                blankLines,
                mtime: stats.mtime, 
                complexity,
                gitDelta 
            };
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

    public dispose() {
        this.cache.clear();
        this.baseCache.clear();
    }
}




