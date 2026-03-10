import * as vscode from 'vscode';
import { LineCountService } from './LineCountService';
import { formatLineCount, getHeatmapColor } from './utils';

export class LineCountDecorationProvider implements vscode.FileDecorationProvider {
    private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    constructor(private service: LineCountService) {}

    /**
     * The core "Lazy" hook. Called by VSCode when a file is visible in Explorer.
     */
    async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.FileDecoration | undefined> {
        // If we have it in cache, return immediately
        const cached = this.service.getCachedEntry(uri);
        if (cached !== undefined) {
            return this.createDecoration(cached);
        }

        // Otherwise, kick off computation (Async + Lazy)
        this.service.computeLineCount(uri).then(entry => {
            if (entry !== undefined && !token.isCancellationRequested) {
                this._onDidChangeFileDecorations.fire(uri);
            }
        });

        return undefined;
    }

    private createDecoration(entry: any): vscode.FileDecoration {
        const config = vscode.workspace.getConfiguration('lineCount');
        let textBadge = formatLineCount(entry.count);
        let color: vscode.ThemeColor | undefined;
        let tooltip = `${entry.count.toLocaleString()} lines`;

        // 1. Git Delta handling
        if (config.get('showGitDelta') && entry.gitDelta !== undefined && entry.gitDelta !== 0) {
            const sign = entry.gitDelta > 0 ? '+' : '';
            textBadge += ` (${sign}${entry.gitDelta})`;
            tooltip += ` (${sign}${entry.gitDelta} since HEAD)`;
        }

        // 2. Complexity handling
        if (config.get('showComplexity') && entry.complexity) {
            const level = entry.complexity.level;
            if (level === 'high') {
                textBadge = '🔴'; // Use icon as badge if high complexity
                tooltip += ` · High Complexity (Score: ${entry.complexity.score})`;
            } else if (level === 'medium') {
                textBadge = '⚠'; // Use icon as badge if medium complexity
                tooltip += ` · Medium Complexity (Score: ${entry.complexity.score})`;
            }
        }

        // 2. Heatmap handling
        if (config.get('showHeatmap')) {
            color = getHeatmapColor(entry.count);
        }

        return {
            badge: textBadge,
            color,
            tooltip
        };
    }

    public refresh(uri?: vscode.Uri | vscode.Uri[]) {
        this._onDidChangeFileDecorations.fire(uri || []);
    }
}
