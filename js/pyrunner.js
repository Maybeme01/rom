/* ==========================================================================
   Queen Rory - Python Execution Engine (Pyodide / WebAssembly)
   Supports: In-browser execution, Interactive Python REPL, Stdout/Stderr hooks,
             pip package management, pyodide-http network patching,
             Typo auto-correction, Matplotlib figure capture, and virtual filesystem sync
   ========================================================================== */

class PythonRunner {
  constructor() {
    this.pyodide = null;
    this.isLoading = false;
    this.isReady = false;
    this.isRunning = false;
    this.installedPackages = new Set(['builtins', 'math', 'sys', 'datetime', 'json', 'random', 're']);

    // Callbacks
    this.onStatusChange = null; // (status, message) => {}
    this.onStdout = null;       // (text) => {}
    this.onStderr = null;       // (text) => {}
    this.onPlot = null;         // (base64Img) => {}
  }

  async initPyodide(cdnBaseUrl = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/') {
    if (this.isReady || this.isLoading) return;
    this.isLoading = true;
    this.triggerStatus('loading', 'Loading Python 3.12 (WebAssembly)...');

    try {
      if (typeof loadPyodide === 'undefined') {
        throw new Error('Pyodide script tag not loaded. Check internet connection or CDN.');
      }

      this.pyodide = await loadPyodide({
        indexURL: cdnBaseUrl,
        stdout: (text) => {
          if (this.onStdout) this.onStdout(text + '\n');
        },
        stderr: (text) => {
          if (this.onStderr) this.onStderr(text + '\n');
        }
      });

      // Configure stdin for input()
      this.pyodide.setStdin({
        stdin: () => {
          const res = window.prompt('Python input():');
          if (this.onStdout && res !== null) {
            this.onStdout(`${res}\n`);
          }
          return res !== null ? res : '';
        }
      });

      // Load micropip & pyodide-http for package management & network patching
      await this.pyodide.loadPackage('micropip');
      this.installedPackages.add('micropip');

      try {
        await this.pyodide.loadPackage('pyodide-http');
        await this.pyodide.runPythonAsync(`
import pyodide_http
pyodide_http.patch_all()
`);
        this.installedPackages.add('pyodide-http');
      } catch (e) {
        console.warn('pyodide-http could not be loaded or patched:', e);
      }

      // Configure interactive environment namespace and matplotlib helper
      await this.pyodide.runPythonAsync(`
import sys
_repl_globals = {}

def _get_matplotlib_figures_base64():
    if 'matplotlib.pyplot' in sys.modules:
        import matplotlib.pyplot as plt
        import io, base64
        figs = [plt.figure(n) for n in plt.get_fignums()]
        if figs:
            results = []
            for fig in figs:
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight')
                buf.seek(0)
                results.append(base64.b64encode(buf.read()).decode('utf-8'))
            plt.close('all')
            return results
    return []
`);

      this.isReady = true;
      this.isLoading = false;
      this.triggerStatus('ready', 'Python 3.12 Ready');
    } catch (err) {
      this.isLoading = false;
      this.isReady = false;
      this.triggerStatus('error', `Failed to load Pyodide: ${err.message}`);
      console.error('Pyodide initialization error:', err);
      throw err;
    }
  }

  triggerStatus(status, message) {
    if (this.onStatusChange) {
      this.onStatusChange(status, message);
    }
  }

  // Sync VFS files into Pyodide's FS before running
  syncFilesToPyodide() {
    if (!this.pyodide || !window.vfs) return;

    const FS = this.pyodide.FS;
    for (const [path, file] of Object.entries(window.vfs.files)) {
      if (file.isFolder) {
        const cleanPath = path.replace(/\/$/, '');
        try {
          FS.mkdirTree('/' + cleanPath);
        } catch (e) { }
      } else {
        const parts = path.split('/');
        if (parts.length > 1) {
          const dir = parts.slice(0, -1).join('/');
          try {
            FS.mkdirTree('/' + dir);
          } catch (e) { }
        }
        try {
          FS.writeFile('/' + path, file.content, { encoding: 'utf8' });
        } catch (e) {
          console.warn(`Failed writing ${path} to Pyodide FS:`, e);
        }
      }
    }
  }

  // Scan Pyodide's workspace for files created or modified by Python code
  syncFilesFromPyodide() {
    if (!this.pyodide || !window.vfs) return;
    const FS = this.pyodide.FS;

    const scanDir = (dirPath) => {
      try {
        const entries = FS.readdir(dirPath);
        for (const entry of entries) {
          if (entry === '.' || entry === '..') continue;
          const fullPath = (dirPath === '/' ? '' : dirPath + '/') + entry;
          const stat = FS.stat(fullPath);
          const isDir = FS.isDir(stat.mode);
          const relativePath = fullPath.replace(/^\//, '');

          // Ignore standard system pyodide folders
          if (['lib', 'tmp', 'home', 'dev', 'proc'].includes(relativePath.split('/')[0])) {
            continue;
          }

          if (isDir) {
            if (!window.vfs.files[relativePath + '/']) {
              window.vfs.createFolder(relativePath);
            }
            scanDir(fullPath);
          } else {
            const content = FS.readFile(fullPath, { encoding: 'utf8' });
            if (!window.vfs.files[relativePath] || window.vfs.files[relativePath].content !== content) {
              window.vfs.files[relativePath] = { content: content, isFolder: false };
              window.vfs.persist();
            }
          }
        }
      } catch (e) { }
    };

    scanDir('/');
    if (window.ui && window.ui.renderFileTree) {
      window.ui.renderFileTree();
    }
  }

  // --- Run a complete Python Script ---
  async runCode(code, filename = 'main.py') {
    if (!this.isReady) {
      await this.initPyodide();
    }

    if (this.isRunning) {
      this.triggerStatus('running', 'Execution already in progress...');
      return;
    }

    this.isRunning = true;
    this.triggerStatus('running', `Running ${filename}...`);
    const startTime = performance.now();

    try {
      this.syncFilesToPyodide();

      // Configure environment
      await this.pyodide.runPythonAsync(`
import sys
sys.argv = ['${filename}']
__file__ = '${filename}'
`);

      // Execute code
      await this.pyodide.runPythonAsync(code);

      // Check if any matplotlib plots were created
      try {
        const plotsProxy = await this.pyodide.runPythonAsync(`_get_matplotlib_figures_base64()`);
        const plotImages = plotsProxy.toJs();
        plotsProxy.destroy();

        if (plotImages && plotImages.length > 0) {
          this.displayPlots(plotImages);
        }
      } catch (plotErr) {
        console.warn('Plot capture error:', plotErr);
      }

      // Sync modified or created files
      this.syncFilesFromPyodide();

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
      this.triggerStatus('ready', `Finished in ${elapsed}s`);
      if (this.onStdout) {
        this.onStdout(`\n[Process completed successfully in ${elapsed}s]\n`);
      }
    } catch (err) {
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
      this.triggerStatus('error', `Execution error after ${elapsed}s`);
      if (this.onStderr) {
        this.onStderr(`\nTraceback (most recent call last):\n${err.message}\n`);
      }
    } finally {
      this.isRunning = false;
    }
  }

  displayPlots(base64Images) {
    const target = document.getElementById('matplotlib-target');
    if (!target) return;
    target.innerHTML = '';

    base64Images.forEach((b64, idx) => {
      const card = document.createElement('div');
      card.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 10px 0; background: rgba(0,0,0,0.25); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);';

      const img = document.createElement('img');
      img.src = `data:image/png;base64,${b64}`;
      img.style.cssText = 'max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.3);';

      const dlBtn = document.createElement('button');
      dlBtn.className = 'btn-secondary';
      dlBtn.innerHTML = `⬇️ Download Plot #${idx + 1}`;
      dlBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = img.src;
        a.download = `plot_${idx + 1}.png`;
        a.click();
      };

      card.appendChild(img);
      card.appendChild(dlBtn);
      target.appendChild(card);
    });

    if (window.terminalManager) {
      window.terminalManager.switchTab('plots');
    }
    if (window.ui) {
      window.ui.showToast(`📊 Rendered ${base64Images.length} plot(s) in PLOTS tab!`, 'success');
    }
  }

  // --- Interactive Python REPL Evaluation ---
  async runInteractive(snippet) {
    if (!this.isReady) {
      await this.initPyodide();
    }

    snippet = snippet.trim();
    if (!snippet) return '';

    try {
      this.syncFilesToPyodide();

      const result = await this.pyodide.runPythonAsync(`
import sys
from pyodide.code import eval_code

_code_to_run = ${JSON.stringify(snippet)}
_output = None
try:
    _output = eval_code(_code_to_run, globals=_repl_globals)
except Exception as _e:
    raise _e

_output
`);

      // Check for plots
      try {
        const plotsProxy = await this.pyodide.runPythonAsync(`_get_matplotlib_figures_base64()`);
        const plotImages = plotsProxy.toJs();
        plotsProxy.destroy();
        if (plotImages && plotImages.length > 0) {
          this.displayPlots(plotImages);
        }
      } catch (e) { }

      this.syncFilesFromPyodide();

      if (result !== undefined && result !== null) {
        return String(result);
      }
      return '';
    } catch (err) {
      throw err;
    }
  }

  // --- Smart Package Installation with Typo Detection ---
  async installPackage(rawPackageInput) {
    if (!this.isReady) {
      await this.initPyodide();
    }

    // Sanitize input (strip "pip install" if present)
    let packageName = rawPackageInput.trim();
    packageName = packageName.replace(/^pip\s+install\s+/i, '').trim();

    if (!packageName) return false;

    // Common Package Typo Map (Auto-correction)
    const TYPO_MAP = {
      'requsts': 'requests',
      'requst': 'requests',
      'request': 'requests',
      'reqeusts': 'requests',
      'numpi': 'numpy',
      'np': 'numpy',
      'panda': 'pandas',
      'pd': 'pandas',
      'matplot': 'matplotlib',
      'matplotib': 'matplotlib',
      'pyplot': 'matplotlib',
      'scikitlearn': 'scikit-learn',
      'sklearn': 'scikit-learn',
      'bs4': 'beautifulsoup4',
      'soup': 'beautifulsoup4',
      'pil': 'pillow',
      'nmap': 'python-nmap'
    };

    const cleanLower = packageName.toLowerCase();
    if (TYPO_MAP[cleanLower]) {
      const suggested = TYPO_MAP[cleanLower];
      if (this.onStdout) {
        this.onStdout(`💡 Note: Auto-correcting package typo '${packageName}' -> '${suggested}'\n`);
      }
      packageName = suggested;
    }

    this.triggerStatus('loading', `Installing ${packageName}...`);
    if (this.onStdout) {
      this.onStdout(`[Package Manager] Downloading and installing '${packageName}'...\n`);
    }

    try {
      // 1. Try Pyodide pre-built packages first (e.g. numpy, pandas, matplotlib, scipy)
      try {
        await this.pyodide.loadPackage(packageName);
        this.installedPackages.add(packageName);
        this.triggerStatus('ready', `Package '${packageName}' loaded!`);
        if (this.onStdout) {
          this.onStdout(`✅ Successfully loaded pre-compiled package: ${packageName}\n`);
        }
        return true;
      } catch (nativeErr) {
        // Not a pre-built Pyodide package, proceed to micropip
      }

      // 2. Try installing from PyPI via micropip
      const micropip = this.pyodide.pyimport('micropip');
      await micropip.install(packageName);
      this.installedPackages.add(packageName);

      this.triggerStatus('ready', `Package '${packageName}' installed!`);
      if (this.onStdout) {
        this.onStdout(`✅ Successfully installed package: ${packageName} from PyPI\n`);
      }
      return true;
    } catch (err) {
      this.triggerStatus('error', `Failed to install '${packageName}'`);

      const errMsg = err.message || '';

      // Catch 404 / package not found on PyPI (e.g. text/plain from invalid package name)
      if (errMsg.includes("Unsupported content type") || errMsg.includes("404") || errMsg.includes("No matching distribution found")) {
        if (this.onStderr) {
          this.onStderr(`❌ الحزمة '${packageName}' غير موجودة على مستودع PyPI. يرجى التحقق من صحة كتابة اسم الحزمة.\n`);
        }
        return false;
      }

      // Catch native C binary / non-pure wheel
      if (errMsg.includes("Can't find a pure Python 3 wheel")) {
        let helpTip = '';
        if (packageName.toLowerCase().includes('nmap')) {
          helpTip = `
💡 ملاحظة حول مكتبات الفحص والشبكات (مثل nmap / scapy):
المكتبات التي تتطلب برامج نظام محلية (Nmap Binary) أو تحكم مباشر في كروت الشبكة (Raw Sockets) لا يمكن تشغيلها داخل بيئة المتصفح المعزولة (Browser Sandbox).
بدائل مقترحة يمكنك استخدامها في المتصفح:
- requests (لطلبات الويب و APIs)
- urllib3 / beautifulsoup4 (لتحليل الويب)
- socket (للبروتوكولات القياسية المسموحة)
`;
        } else {
          helpTip = `
💡 سبب الخطأ:
هذه الحزمة تعتمد على كود بلغة C أو برامج نظام محلية غير مترجمة لـ WebAssembly.
بيئة المتصفح تدعم الحزم الخالصة (Pure Python) والحزم العلمية الكبرى (numpy, pandas, matplotlib, requests, scipy).
`;
        }

        if (this.onStderr) {
          this.onStderr(`❌ تعذر تثبيت الحزمة '${packageName}':\n${err.message}\n${helpTip}\n`);
        }
      } else {
        if (this.onStderr) {
          this.onStderr(`❌ خطأ أثناء تثبيت '${packageName}':\n${err.message}\n`);
        }
      }
      return false;
    }
  }
}

// Global Runner singleton
window.pyRunner = new PythonRunner();
