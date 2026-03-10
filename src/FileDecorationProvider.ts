import * as vscode from 'vscode';
import { LineCountService } from './LineCountService';
import { formatLineCount } from './utils';

export class LineCountDecorationProvider implements vscode.FileDecorationProvider {
    private readonly _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    constructor(private service: LineCountService) {}

    /**
     * The core "Lazy" hook. Called by VSCode when a file is visible in Explorer.
     */
    async provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.FileDecoration | undefined> {
        // If we have it in cache, return immediately
        const cached = this.service.getCachedCount(uri);
        if (cached !== undefined) {
            return this.createDecoration(cached);
        }

        // Otherwise, kick off computation (Async + Lazy)
        // We don't 'await' here to keep the UI thread responsive, 
        // instead we return undefined and trigger a refresh once done.
        this.service.computeLineCount(uri).then(count => {
            if (count !== undefined && !token.isCancellationRequested) {
                this._onDidChangeFileDecorations.fire(uri);
            }
        });

        return undefined;
    }

    private createDecoration(count: number): vscode.FileDecoration {
        return {
            badge: formatLineCount(count), // Appears next to filename
            tooltip: `${count.toLocaleString()} lines`
        };
    }

    public refresh(uri?: vscode.Uri | vscode.Uri[]) {
        this._onDidChangeFileDecorations.fire(uri || []);
    }
}
