# File Length & Complexity Visualizer 📊

Transform your VS Code Explorer into a powerful file health dashboard. Instantly identify bloated files, complex logic, and recent code growth without leaving your file tree.

---

## 🔥 Why Use This?

- **Stop "Monster" Files**: Spot oversized files immediately with heatmap coloring.
- **Identify Technical Debt**: Complexity icons point you toward code that needs refactoring.
- **Track Your Progress**: Real-time Git deltas show exactly how many lines you've added or removed since your last commit.
- **Zero Friction**: High-performance caching ensures your workspace stays lightning-fast.

---

## ✨ Key Features

### 1. � Instant Inline Metrics

See line counts right next to filenames.

- **Heatmap Colors**: Filenames change color based on scale (Red for huge, Orange for medium, Green for small).
- **Complexity Alerts**: ⚠ (Medium) and 🔴 (High) icons appear for files with complex logic (nested loops, many conditionals).
- **Git Delta**: See changes like `(+12)` or `(-3)` relative to your last Git commit.

### 2. 📊 Professional Analytics

Get a "birds-eye view" of your entire project.

- **Activity Bar View**: Access quick stats and top 10 largest files directly from the side panel.
- **Dashboard**: Run `File Length: Show Analytics Dashboard` for an interactive full-screen experience:
  - **Project Summary**: Total files, lines, and code/comment density.
  - **Top 10 Largest Files**: Your project's "heavyweights" listed in order.
  - **Line Distribution**: A bar chart showing the scale of your codebase.
  - **Ratio Analysis**: A pie chart breaking down Code vs. Comments vs. Blank lines.

### 3. 🚀 Built for Scale

- **Smart LRU Cache**: Results are cached and only recomputed when files actually change.
- **Lazy Loading**: Only processes what you see in the Explorer; handles monorepos with ease.
- **Throttled Updates**: Efficient processing ensures no impact on typing speed.

---

## 📖 How to Use

1. **View Metrics**: Open the **Explorer** (`Ctrl+Shift+E`). Metrics appear automatically next to filenames.
2. **Open Dashboard**: Press `Ctrl+Shift+P` and search for **"File Length: Show Analytics Dashboard"**.
3. **Deep Dive**: Hover over any line count to see a detailed tooltip including:
   - Absolute line count.
   - Exact complexity score.
   - Git status relative to HEAD.

---

## ⚙️ Customization

Customize exactly how you count lines in VS Code Settings (`Ctrl + ,`):

| Setting                           | Default | Description                                                 |
| :-------------------------------- | :------ | :---------------------------------------------------------- |
| `lineCount.enabled`               | `true`  | Toggle the entire extension.                                |
| `lineCount.showComplexity`        | `true`  | Show/hide complexity icons (⚠/🔴).                          |
| `lineCount.showHeatmap`           | `true`  | Toggle filename coloring based on size.                     |
| `lineCount.showGitDelta`          | `true`  | Show changes since last commit.                             |
| `lineCount.ignoreComments`        | `false` | Exclude comment lines (supports JS, TS, Python, C++, etc.). |
| `lineCount.showOnlyNonEmptyLines` | `false` | Exclude blank lines from count.                             |

---

## 🛠️ Installation & Build

### From Marketplace

Search for **"File Length & Complexity Visualizer"** in the VS Code Extensions view and click Install.

### From Source (For Developers)

1. `git clone https://github.com/thienle99-dev/file-length.git`
2. `pnpm install`
3. Press `F5` to start debugging.
4. To package as `.vsix`: `vsce package`

---

## 📋 Requirements

- **VS Code**: 1.75+
- **Git**: (Optional) Required for real-time Delta calculations.

---

## 💬 Support & Contribution

- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/thienle99-dev/file-length/issues).
- **Source**: Check out the [source code](https://github.com/thienle99-dev/file-length) and feel free to contribute!

---

## ⚠️ Known Issues

- **Remote Development**: In some SSH/Remote environments, Git delta calculation might be slower depending on the network.
- **Large Files**: Files over 10MB are automatically ignored to preserve UI performance.

## 🗒️ Release Notes

### 1.0.3

- Added **Git Delta** support: See real-time changes since your last commit.
- Integrated **Complexity Analysis**: Visual warnings for complex code.
- Added **Heatmap coloring** for filenames.
- Introduced the **Analytics Dashboard** for whole-project insights.

### 1.0.0

- Initial release with basic line counting and performance caching.

---

## 📄 License

Released under the **MIT License**. Created with ❤️ by **ChiThien**.
