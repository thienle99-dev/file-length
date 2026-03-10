import * as vscode from 'vscode';
import { LineCountService } from './LineCountService';
import { LineCountDecorationProvider } from './FileDecorationProvider';

export function activate(context: vscode.ExtensionContext) {
    const service = new LineCountService();
    const decorationProvider = new LineCountDecorationProvider(service);

    // 1. Register display provider
    context.subscriptions.push(
        vscode.window.registerFileDecorationProvider(decorationProvider)
    );

    // 2. Watch for file changes across workspace
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    
    // Per-URI throttled refresh to prevent UI thrashing
    const pendingTimers = new Map<string, NodeJS.Timeout>();
    
    const triggerRefresh = (uri: vscode.Uri) => {
        const uriString = uri.toString();
        
        // Clear existing timer for this specific URI
        const existing = pendingTimers.get(uriString);
        if (existing) clearTimeout(existing);

        // Set new timer
        const timer = setTimeout(() => {
            service.invalidate(uri);
            decorationProvider.refresh(uri);
            pendingTimers.delete(uriString);
        }, 150);
        
        pendingTimers.set(uriString, timer);
    };

    watcher.onDidChange(triggerRefresh);
    watcher.onDidCreate(triggerRefresh);
    watcher.onDidDelete((u: vscode.Uri) => { service.invalidate(u); decorationProvider.refresh(u); });

    // Handle renames
    context.subscriptions.push(vscode.workspace.onDidRenameFiles((e: vscode.FileRenameEvent) => {
        e.files.forEach((f: { oldUri: vscode.Uri; newUri: vscode.Uri }) => {
            service.invalidate(f.oldUri);
            service.invalidate(f.newUri);
            decorationProvider.refresh([f.oldUri, f.newUri]);
        });
    }));

    // Handle configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('lineCount')) {
            service.updateConfig();
            service.clearCache();
            decorationProvider.refresh();
        }
    }));

    context.subscriptions.push(watcher, service as any);
}

export function deactivate() {}
