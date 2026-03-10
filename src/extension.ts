import * as vscode from 'vscode';
import { LineCountService } from './LineCountService';
import { LineCountDecorationProvider } from './FileDecorationProvider';
import { WorkspaceScanner } from './WorkspaceScanner';
import { DashboardPanel } from './DashboardPanel';
import { SidebarProvider } from './SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    const service = new LineCountService();
    const decorationProvider = new LineCountDecorationProvider(service);
    const sidebarProvider = new SidebarProvider(service);

    // 1. Register display provider
    context.subscriptions.push(
        vscode.window.registerFileDecorationProvider(decorationProvider)
    );

    // 2. Register Sidebar
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('file-length-sidebar', sidebarProvider)
    );

    // 3. Register Commands
    const scanner = new WorkspaceScanner(service);
    context.subscriptions.push(vscode.commands.registerCommand('file-length-visualizer.showDashboard', async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing project files...",
            cancellable: false
        }, async (progress) => {
            const stats = await scanner.scan();
            DashboardPanel.createOrShow(context.extensionUri, stats);
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('file-length-visualizer.refreshSidebar', () => {
        sidebarProvider.refresh();
    }));

    // Initial scan for sidebar
    sidebarProvider.refresh();

    // 4. Watch for file changes across workspace
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
            sidebarProvider.refresh(); // NEW: Refresh Sidebar
            pendingTimers.delete(uriString);
        }, 150);
        
        pendingTimers.set(uriString, timer);
    };

    watcher.onDidChange(triggerRefresh);
    watcher.onDidCreate(triggerRefresh);
    watcher.onDidDelete((u: vscode.Uri) => { 
        service.invalidate(u); 
        decorationProvider.refresh(u);
        sidebarProvider.refresh(); // NEW: Refresh Sidebar
    });

    // Handle renames
    context.subscriptions.push(vscode.workspace.onDidRenameFiles((e: vscode.FileRenameEvent) => {
        e.files.forEach((f: { oldUri: vscode.Uri, newUri: vscode.Uri }) => {
            service.invalidate(f.oldUri);
            service.invalidate(f.newUri);
            decorationProvider.refresh([f.oldUri, f.newUri]);
        });
        sidebarProvider.refresh(); // NEW: Refresh Sidebar
    }));

    // Handle configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('lineCount')) {
            service.updateConfig();
            service.clearCache();
            service.clearBaseCache();
            decorationProvider.refresh();
            sidebarProvider.refresh(); // NEW: Refresh Sidebar
        }
    }));

    // Handle Git events to refresh deltas
    const gitExt = vscode.extensions.getExtension('vscode.git');
    if (gitExt) {
        gitExt.activate().then(exports => {
            const api = exports.getAPI(1);
            context.subscriptions.push(api.onDidPublish(() => {
                service.clearBaseCache();
                decorationProvider.refresh();
            }));
            api.repositories.forEach((repo: any) => {
                context.subscriptions.push(repo.state.onDidChange(() => {
                    service.clearBaseCache();
                    decorationProvider.refresh();
                }));
            });
        });
    }

    context.subscriptions.push(watcher, service as any);
}

export function deactivate() {}
