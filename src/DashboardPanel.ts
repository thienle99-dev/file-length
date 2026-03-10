import * as vscode from 'vscode';
import { WorkspaceStats } from './WorkspaceScanner';

export class DashboardPanel {
    public static currentPanel: DashboardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, stats: WorkspaceStats) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel._panel.reveal(column);
            DashboardPanel.currentPanel._update(stats);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'lineCountDashboard',
            'File Length Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri]
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel, stats);
    }

    private constructor(panel: vscode.WebviewPanel, stats: WorkspaceStats) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._update(stats);
    }

    public dispose() {
        DashboardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _update(stats: WorkspaceStats) {
        this._panel.webview.html = this._getHtmlForWebview(stats);
    }

    private _getHtmlForWebview(stats: WorkspaceStats) {
        const topFilesJson = JSON.stringify(stats.topFiles);
        const distributionJson = JSON.stringify(stats.distribution);
        const pieDataJson = JSON.stringify({
            code: stats.totalCode,
            comments: stats.totalComments,
            blanks: stats.totalBlanks
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Length Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 2rem;
        }
        .card {
            background-color: var(--vscode-sideBar-background);
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .card h2 {
            margin-top: 0;
            font-size: 1.2rem;
            color: var(--vscode-button-background);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .top-list {
            list-style: none;
            padding: 0;
        }
        .top-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .top-item:last-child { border-bottom: none; }
        .file-path {
            color: var(--vscode-textLink-foreground);
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 70%;
        }
        .file-count {
            font-weight: bold;
            color: var(--vscode-charts-red);
        }
        .summary-banner {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-box {
            background: var(--vscode-button-secondaryBackground);
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            display: block;
        }
        .stat-label {
            font-size: 0.8rem;
            opacity: 0.8;
        }
        canvas {
            max-height: 300px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Project Analytics</h1>
        <div>${stats.totalFiles} Files Analyzed</div>
    </div>

    <div class="summary-banner">
        <div class="stat-box">
            <span class="stat-value">${stats.totalLines.toLocaleString()}</span>
            <span class="stat-label">Total Lines</span>
        </div>
        <div class="stat-box">
            <span class="stat-value">${stats.totalCode.toLocaleString()}</span>
            <span class="stat-label">Code Lines</span>
        </div>
        <div class="stat-box">
            <span class="stat-value">${stats.totalComments.toLocaleString()}</span>
            <span class="stat-label">Comments</span>
        </div>
        <div class="stat-box">
            <span class="stat-value">${Math.round((stats.totalComments / stats.totalLines) * 100) || 0}%</span>
            <span class="stat-label">Comment Ratio</span>
        </div>
    </div>

    <div class="grid">
        <div class="card">
            <h2>🏆 Top 10 Largest Files</h2>
            <ul class="top-list" id="topList"></ul>
        </div>

        <div class="card">
            <h2>📈 Line Distribution</h2>
            <canvas id="distChart"></canvas>
        </div>

        <div class="card">
            <h2>🥧 Code / Comment / Blank Ratio</h2>
            <canvas id="ratioChart"></canvas>
        </div>
    </div>

    <script>
        const topFiles = ${topFilesJson};
        const distribution = ${distributionJson};
        const pieData = ${pieDataJson};

        // Render Top List
        const list = document.getElementById('topList');
        topFiles.forEach(file => {
            const li = document.createElement('li');
            li.className = 'top-item';
            li.innerHTML = \`<span class="file-path" title="\${file.path}">\${file.path}</span><span class="file-count">\${file.count.toLocaleString()}</span>\`;
            list.appendChild(li);
        });

        // Charts theme integration
        const getVscodeColor = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

        // Distribution Chart
        new Chart(document.getElementById('distChart'), {
            type: 'bar',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    label: 'Files',
                    data: Object.values(distribution),
                    backgroundColor: getVscodeColor('--vscode-charts-blue') || '#3794ef'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: getVscodeColor('--vscode-panel-border') } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Ratio Chart
        new Chart(document.getElementById('ratioChart'), {
            type: 'doughnut',
            data: {
                labels: ['Code', 'Comments', 'Blanks'],
                datasets: [{
                    data: [pieData.code, pieData.comments, pieData.blanks],
                    backgroundColor: [
                        getVscodeColor('--vscode-charts-green') || '#3fb950',
                        getVscodeColor('--vscode-charts-orange') || '#d29922',
                        getVscodeColor('--vscode-charts-blue') || '#3794ef'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: getVscodeColor('--vscode-foreground') } }
                }
            }
        });
    </script>
</body>
</html>`;
    }
}
