import * as vscode from 'vscode';
import { LineCountService } from './LineCountService';

export interface WorkspaceStats {
    totalFiles: number;
    totalLines: number;
    totalCode: number;
    totalComments: number;
    totalBlanks: number;
    topFiles: { path: string, count: number }[];
    distribution: { [key: string]: number };
}

export class WorkspaceScanner {
    constructor(private service: LineCountService) {}

    public async scan(): Promise<WorkspaceStats> {
        // findFiles honors files.exclude and search.exclude by default
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        
        const stats: WorkspaceStats = {
            totalFiles: 0,
            totalLines: 0,
            totalCode: 0,
            totalComments: 0,
            totalBlanks: 0,
            topFiles: [],
            distribution: {
                '0-100': 0,
                '101-300': 0,
                '301-600': 0,
                '601-1000': 0,
                '1001+': 0
            }
        };

        const allFilesData: { path: string, count: number }[] = [];

        // Process in batches to avoid overwhelming the system
        const batchSize = 50;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(uri => this.service.computeLineCount(uri)));
            
            results.forEach((entry: any, index: number) => {
                if (entry) {
                    stats.totalFiles++;
                    stats.totalCode += entry.codeLines;
                    stats.totalComments += entry.commentLines;
                    stats.totalBlanks += entry.blankLines;
                    const total = entry.codeLines + entry.commentLines + entry.blankLines;
                    stats.totalLines += total;

                    const relPath = vscode.workspace.asRelativePath(batch[index]);
                    allFilesData.push({ path: relPath, count: entry.count });

                    // Distribution
                    if (entry.count <= 100) stats.distribution['0-100']++;
                    else if (entry.count <= 300) stats.distribution['101-300']++;
                    else if (entry.count <= 600) stats.distribution['301-600']++;
                    else if (entry.count <= 1000) stats.distribution['601-1000']++;
                    else stats.distribution['1001+']++;
                }
            });
        }

        // Sort for top 10
        stats.topFiles = allFilesData
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    }
}
