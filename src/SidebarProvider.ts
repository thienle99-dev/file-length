import * as vscode from 'vscode';
import { LineCountService } from './LineCountService';
import { WorkspaceScanner, WorkspaceStats } from './WorkspaceScanner';

export class SidebarProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | void> = new vscode.EventEmitter<TreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private stats: WorkspaceStats | undefined;

    constructor(private service: LineCountService) {}

    refresh(): void {
        const scanner = new WorkspaceScanner(this.service);
        scanner.scan().then(stats => {
            this.stats = stats;
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): Thenable<TreeItem[]> {
        if (!this.stats) {
            return Promise.resolve([new TreeItem("Click refresh to scan workspace", vscode.TreeItemCollapsibleState.None, "refresh")]);
        }

        if (!element) {
            return Promise.resolve([
                new TreeItem("Summary", vscode.TreeItemCollapsibleState.Expanded, "root-summary"),
                new TreeItem("Languages", vscode.TreeItemCollapsibleState.Collapsed, "root-languages"),
                new TreeItem("Top 10 Files", vscode.TreeItemCollapsibleState.Collapsed, "root-top"),
            ]);
        }

        if (element.id === "root-summary") {
            return Promise.resolve([
                new TreeItem(`Total Lines: ${this.stats.totalLines.toLocaleString()}`, vscode.TreeItemCollapsibleState.None),
                new TreeItem(`Code: ${this.stats.totalCode.toLocaleString()}`, vscode.TreeItemCollapsibleState.None),
                new TreeItem(`Comments: ${this.stats.totalComments.toLocaleString()}`, vscode.TreeItemCollapsibleState.None),
                new TreeItem(`Ratio: ${Math.round((this.stats.totalComments / this.stats.totalLines) * 100) || 0}%`, vscode.TreeItemCollapsibleState.None),
            ]);
        }

        if (element.id === "root-languages") {
            const sortedLangs = Object.entries(this.stats.languages)
                .sort((a, b) => b[1].lines - a[1].lines);

            return Promise.resolve(sortedLangs.map(([name, data]) => {
                return new TreeItem(
                    `${name}: ${data.lines.toLocaleString()} lines (${data.files} files)`,
                    vscode.TreeItemCollapsibleState.None
                );
            }));
        }

        if (element.id === "root-top") {
            return Promise.resolve(this.stats.topFiles.map(file => {
                const item = new TreeItem(`${file.path} (${file.count.toLocaleString()})`, vscode.TreeItemCollapsibleState.None);
                item.command = {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [vscode.Uri.file(file.path)] // Keep Uri for arguments
                };
                item.tooltip = file.path;
                return item;
            }));
        }

        return Promise.resolve([]);
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly id?: string,
        public readonly iconPath?: string | vscode.Uri | vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri }
    ) {
        super(label, collapsibleState);
        this.id = id;
    }
}
