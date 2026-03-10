import * as vscode from 'vscode';

/**
 * Formats a number into an abbreviated string (e.g., 1.2k) or comma-separated.
 */
export function formatLineCount(count: number): string {
    if (count < 1000) {
        return count.toString();
    }
    const k = count / 1000;
    return k.toFixed(k < 10 ? 1 : 0) + 'k';
}

/**
 * Returns a ThemeColor based on the line count for the heatmap feature.
 */
export function getHeatmapColor(count: number): vscode.ThemeColor | undefined {
    if (count >= 1000) return new vscode.ThemeColor('charts.red');
    if (count >= 500) return new vscode.ThemeColor('charts.orange');
    if (count <= 100) return new vscode.ThemeColor('charts.green');
    return undefined;
}

/**
 * Common comment regex patterns per extension
 */
const COMMENT_PATTERNS: Record<string, RegExp> = {
    // C-style
    'js': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'ts': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'tsx': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'jsx': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'java': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'cpp': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'c': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'cs': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'go': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'rs': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'swift': /\/\/.*|\/\*[\s\S]*?\*\//gm,
    'css': /\/\*[\s\S]*?\*\//gm,
    
    // Hash-style
    'py': /#.*$/gm,
    'rb': /#.*$/gm,
    'sh': /#.*$/gm,
    'yaml': /#.*$/gm,
    'yml': /#.*$/gm,
    'toml': /#.*$/gm,
    'pl': /#.*$/gm,
    
    // HTML-style
    'html': /<!--[\s\S]*?-->/gm,
    'xml': /<!--[\s\S]*?-->/gm,
    'svg': /<!--[\s\S]*?-->/gm,

    // SQL/Lua
    'sql': /--.*$/gm,
    'lua': /--.*|--\[\[[\s\S]*?\]\]/gm,
};

export function getCommentRegex(filePath: string): RegExp | undefined {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext ? COMMENT_PATTERNS[ext] : undefined;
}

/**
 * Approximates Cyclomatic Complexity using regex to count decision points.
 */
export function calculateComplexity(text: string, filePath: string): { score: number, level: 'low' | 'medium' | 'high' } {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    // 1. Strip strings to avoid counting decision points inside text
    const cleanText = text.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '').replace(/`[\s\S]*?`/g, '');
    
    // 2. Count decision points (if, for, while, switch, catch, &&, ||, ?)
    const decisionPoints = (cleanText.match(/\b(if|for|while|switch|catch)\b|&&|\|\||\?|case\s+/g) || []).length;
    
    // 3. Count functions/methods to find average complexity per block
    const functions = (cleanText.match(/\b(function|class|constructor)\b|=>|\w+\s*\([^)]*\)\s*\{/g) || []).length;
    
    const score = decisionPoints;
    const avgScore = score / Math.max(functions, 1);
    
    let level: 'low' | 'medium' | 'high' = 'low';
    if (avgScore > 10 || score > 50) level = 'high';
    else if (avgScore > 5 || score > 20) level = 'medium';
    
    return { score, level };
}

const IGNORED_PATHS = [
    'node_modules',
    'dist',
    'build',
    '.git',
    '.vscode',
    'out'
];

export function shouldIgnorePath(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return IGNORED_PATHS.some(p => {
        const pattern = new RegExp(`(^|/)${p.replace('.', '\\.')}(/|$)`);
        return pattern.test(normalizedPath);
    });
}

export function isCodeFile(filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!ext) return false;
    
    // Check if it's in our comment patterns or other common code/config files
    const codeExts = new Set([
        ...Object.keys(COMMENT_PATTERNS),
        'md', 'json', 'txt', 'ini', 'conf', 'env', 'gradle', 'properties'
    ]);
    
    return codeExts.has(ext);
}

/**
 * Simple LRU cache implementation using native Map (which preserves insertion order)
 */
export class LRUCache<V> {
    private map = new Map<string, V>();
    constructor(private maxSize = 5000) {}

    get(key: string): V | undefined {
        const val = this.map.get(key);
        if (val !== undefined) {
            // Delete and re-set to move the accessed item to the end (most recent)
            this.map.delete(key);
            this.map.set(key, val);
        }
        return val;
    }

    set(key: string, value: V) {
        if (this.map.has(key)) {
            this.map.delete(key);
        } else if (this.map.size >= this.maxSize) {
            // Remove the oldest item (the first key in insertion order)
            const oldestKey = this.map.keys().next().value;
            if (oldestKey !== undefined) {
                this.map.delete(oldestKey);
            }
        }
        this.map.set(key, value);
    }

    delete(key: string) {
        this.map.delete(key);
    }

    clear() {
        this.map.clear();
    }
}


