# File Length & Complexity Visualizer 📊

Display total lines of code and complexity insights directly in the VS Code Explorer. A lightweight and professional solution for managing file quality and scale in your projects.

![Logo](icon.png)
![Mockup](mockup.png)

---

## ✨ Features

- **🔍 Inline Display**: Line counts appear right next to filenames in the Explorer file tree.
- **📈 Complexity Analysis**: Automatically calculates Cyclomatic Complexity and adds warning labels (⚠ or 🔴) for files that may need refactoring.
- **🎨 Color Heatmap**: Automatically changes filename and line count colors to easily identify large files (Red > 1000 lines, Orange > 500 lines, Green < 100 lines).
- **🚀 Lazy Loading & High Performance**:
  - Computations are only performed for files currently visible in the viewport.
  - Utilizes an **LRU Cache** and **mtime** validation to avoid redundant disk I/O.
  - 150ms per-file throttling while typing to ensure a smooth UI experience.
- **🎛️ Flexible Customization**: Ignore blank lines, skip comments (multi-language support), or exclude specific paths (`node_modules`, `dist`, etc.).

---

## 📖 How to Use

Once installed, the extension activates automatically. You will see metrics appear next to filenames in the Explorer:

1. **Colors (Heatmap)**:
   - **Green**: Small, maintainable files (< 100 lines).
   - **Orange**: Growing files (> 500 lines).
   - **Red**: Very large files; consider breaking them down (> 1000 lines).
2. **Icons (Complexity)**:
   - **⚠**: Medium complexity.
   - **🔴**: High complexity (many if/else blocks, deep nesting, or too many functions).
3. **Tooltip**: Hover over the line count to see detailed complexity scores and metrics.

---

## ⚙️ Configuration (Settings)

Open Settings (`Ctrl + ,`) and search for `File Length Visualizer`:

| Setting                           | Default | Description                                                      |
| :-------------------------------- | :------ | :--------------------------------------------------------------- |
| `lineCount.enabled`               | `true`  | Enable or disable the entire extension.                          |
| `lineCount.showComplexity`        | `true`  | Show complexity warning icons (⚠/🔴).                            |
| `lineCount.showHeatmap`           | `true`  | Automatically change filename color based on length.             |
| `lineCount.ignoreComments`        | `false` | Skip lines containing only comments (JS, TS, Python, C++, etc.). |
| `lineCount.showOnlyNonEmptyLines` | `false` | Only count lines that contain content.                           |

---

## 🛠️ Build from Source

### 📋 Prerequisites

- **Node.js**: Version 16.x or later.
- **pnpm**: Recommended (or npm/yarn).
- **VS Code**: Version 1.75.0 or later.

### 🔨 Development Workflow

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thienle99-dev/file-length.git
   cd file-length
   ```
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Run in Debug Mode**:
   - Press `F5` or go to the `Run and Debug` tab and select `Run Extension`.
   - A new VS Code window (Extension Development Host) will open for testing.

### 📦 Packaging & Publishing

To create a `.vsix` installation file:

1. Install `vsce`: `pnpm install -g @vscode/vsce`
2. Package the extension:
   ```bash
   vsce package
   ```
   _Note: The generated `.vsix` file can be used for manual installation in your VS Code._

---

## 📄 License

Released under the **MIT License**. See [LICENSE](LICENSE.md) for details.

Copyright (c) 2026 **ChiThien**.
