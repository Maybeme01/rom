/* ==========================================================================
   PyCode Studio - Virtual File System & Local Disk Manager
   Supports: In-browser VFS, Native File System Access API (open & save real PC folders),
             LocalStorage persistence, ZIP export/import, single file download
   ========================================================================== */

const DEFAULT_MAIN_PY = `import os

os.system('')

RED = "\\033[91;1m"     
WHITE = "\\033[97;1m"    
RESET = "\\033[0m"      

def draw_queen_rori_heart():
    name = "كوين روري"
    
    heart_lines = [
        "              ♥♥♥♥♥♥♥♥♥♥            ♥♥♥♥♥♥♥♥♥♥",
        "          ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥        ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "        ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥    ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "       ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "      ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "      ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "      ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "       ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        f"        ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥ {WHITE}{name}{RED} ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "         ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "           ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "             ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "               ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "                 ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "                   ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "                     ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥",
        "                       ♥♥♥♥♥♥♥♥♥♥♥♥",
        "                         ♥♥♥♥♥♥♥♥",
        "                           ♥♥♥♥",
        "                             ♥♥"
    ]
    
    print()
    for line in heart_lines:
        print(f"{RED}{line}{RESET}")

if __name__ == '__main__':
    draw_queen_rori_heart()
`;

class VirtualFileSystem {
  constructor() {
    this.storageKey = 'pycode_studio_vfs_v2'; // upgraded key for fresh default
    this.files = {}; // Key: path (e.g., "main.py", "utils/calc.py"), Value: { content: string, isFolder: bool }
    this.activeFilePath = null;
    this.openTabs = []; // Array of open file paths
    this.isNativeMode = false;
    this.nativeDirHandle = null;
    this.nativeFileHandles = {};
    this.nativeDirName = '';
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.files = parsed.files || {};
        this.activeFilePath = parsed.activeFilePath || 'main.py';
        this.openTabs = parsed.openTabs || ['main.py'];
      } catch (e) {
        console.error('Failed to parse saved VFS:', e);
        this.loadDefaultWorkspace();
      }
    } else {
      this.loadDefaultWorkspace();
    }

    // Ensure main.py exists and has the new Queen Rori heart script
    if (!this.files['main.py'] || typeof this.files['main.py'].content !== 'string' || !this.files['main.py'].content.includes('heart_lines')) {
      this.files['main.py'] = {
        content: DEFAULT_MAIN_PY,
        isFolder: false
      };
      this.persist();
    }

    if (!this.activeFilePath || !this.files[this.activeFilePath]) {
      this.activeFilePath = 'main.py';
    }
    if (!this.openTabs.includes(this.activeFilePath)) {
      this.openTabs.push(this.activeFilePath);
    }
  }

  loadDefaultWorkspace() {
    this.files = {
      'main.py': {
        content: DEFAULT_MAIN_PY,
        isFolder: false
      },
      'utils/': {
        content: '',
        isFolder: true
      },
      'utils/math_helpers.py': {
        content: `# Helper Module\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\ndef fibonacci(n):\n    sequence = [0, 1]\n    while len(sequence) < n:\n        sequence.append(sequence[-1] + sequence[-2])\n    return sequence[:n]\n`,
        isFolder: false
      },
      'data.txt': {
        content: `Queen Rory Project File\nCreated for fast in-browser Python scripting.\nFeatures: Monaco Editor, Themes, Local/GitHub sync, Pyodide engine.`,
        isFolder: false
      },
      'README.md': {
        content: `# Queen Rory - PyCode Studio\n\nA lightweight, web-based Python IDE inspired by Visual Studio Code.\n\n### Features:\n- 🚀 Runs Python directly in your browser via Pyodide (WebAssembly)\n- 🎨 VS Code themes (Dark+, Light+, Dracula, Monokai, One Dark, GitHub Dark, Cyberpunk)\n- 📁 Full virtual file explorer with multi-file & folder support\n- 💾 Local storage & ZIP export/import\n- ☁️ GitHub Cloud Sync (Gist & Repositories)\n- ⚡ Monaco Editor with Python IntelliSense & autocompletion\n- 🎓 Python Academy: Interactive tutorial with ready-to-run examples\n`,
        isFolder: false
      }
    };
    this.activeFilePath = 'main.py';
    this.openTabs = ['main.py'];
    this.persist();
  }

  persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        files: this.files,
        activeFilePath: this.activeFilePath,
        openTabs: this.openTabs
      }));
    } catch (e) {
      console.warn('LocalStorage quota exceeded or unavailable:', e);
    }
  }

  // --- 1. Real Local Folder Support (File System Access API) ---
  async openNativeDirectory() {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera to open folders directly from your PC.');
    }

    const dirHandle = await window.showDirectoryPicker();
    this.nativeDirHandle = dirHandle;
    this.nativeFileHandles = {};
    const newFiles = {};

    const readDir = async (handle, currentPath = '') => {
      for await (const entry of handle.values()) {
        const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const text = await file.text();
          newFiles[fullPath] = { content: text, isFolder: false };
          this.nativeFileHandles[fullPath] = entry;
        } else if (entry.kind === 'directory') {
          if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '__pycache__') continue;
          newFiles[fullPath + '/'] = { content: '', isFolder: true };
          await readDir(entry, fullPath);
        }
      }
    };

    await readDir(dirHandle);

    if (Object.keys(newFiles).length > 0) {
      this.files = newFiles;
      this.isNativeMode = true;
      this.nativeDirName = dirHandle.name;
      const py = Object.keys(newFiles).find(k => k.endsWith('.py')) || Object.keys(newFiles).find(k => !newFiles[k].isFolder);
      this.activeFilePath = py || null;
      this.openTabs = this.activeFilePath ? [this.activeFilePath] : [];
      this.persist();
      return { name: dirHandle.name, count: Object.keys(newFiles).length };
    }
    return null;
  }

  // --- 2. CRUD Operations ---
  createFile(path, content = '') {
    path = path.replace(/^[\\/]+/, '').trim();
    if (!path) return false;
    if (this.files[path]) {
      return false;
    }
    this.ensureParentFolders(path);
    this.files[path] = { content: content, isFolder: false };
    this.persist();
    return true;
  }

  createFolder(path) {
    path = path.replace(/^[\\/]+/, '').replace(/[\\/]+$/, '').trim() + '/';
    if (!path || path === '/') return false;
    if (this.files[path]) return false;
    this.ensureParentFolders(path);
    this.files[path] = { content: '', isFolder: true };
    this.persist();
    return true;
  }

  ensureParentFolders(path) {
    const parts = path.split('/');
    if (parts.length > 1) {
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current += parts[i] + '/';
        if (!this.files[current]) {
          this.files[current] = { content: '', isFolder: true };
        }
      }
    }
  }

  async saveFile(path, content) {
    if (this.files[path] && !this.files[path].isFolder) {
      this.files[path].content = content;
      this.persist();

      // If working in native folder mode, save directly to physical PC hard drive!
      if (this.isNativeMode && this.nativeFileHandles && this.nativeFileHandles[path]) {
        try {
          const writable = await this.nativeFileHandles[path].createWritable();
          await writable.write(content);
          await writable.close();
        } catch (e) {
          console.warn('Native disk write warning:', e);
        }
      }
      return true;
    }
    return false;
  }

  readFile(path) {
    if (this.files[path] && !this.files[path].isFolder) {
      return this.files[path].content;
    }
    return null;
  }

  renameItem(oldPath, newPath) {
    oldPath = oldPath.replace(/^[\\/]+/, '').trim();
    newPath = newPath.replace(/^[\\/]+/, '').trim();
    if (!this.files[oldPath] || this.files[newPath]) return false;

    const isFolder = this.files[oldPath].isFolder;
    if (isFolder) {
      if (!oldPath.endsWith('/')) oldPath += '/';
      if (!newPath.endsWith('/')) newPath += '/';

      const newFiles = {};
      for (const [k, v] of Object.entries(this.files)) {
        if (k.startsWith(oldPath)) {
          const suffix = k.slice(oldPath.length);
          newFiles[newPath + suffix] = v;
        } else {
          newFiles[k] = v;
        }
      }
      this.files = newFiles;

      this.openTabs = this.openTabs.map(tab => {
        if (tab.startsWith(oldPath)) {
          return newPath + tab.slice(oldPath.length);
        }
        return tab;
      });
      if (this.activeFilePath && this.activeFilePath.startsWith(oldPath)) {
        this.activeFilePath = newPath + this.activeFilePath.slice(oldPath.length);
      }
    } else {
      this.files[newPath] = this.files[oldPath];
      delete this.files[oldPath];

      this.openTabs = this.openTabs.map(t => t === oldPath ? newPath : t);
      if (this.activeFilePath === oldPath) {
        this.activeFilePath = newPath;
      }
    }

    this.persist();
    return true;
  }

  deleteItem(path) {
    if (!this.files[path]) return false;

    if (this.files[path].isFolder) {
      if (!path.endsWith('/')) path += '/';
      for (const k of Object.keys(this.files)) {
        if (k.startsWith(path)) {
          delete this.files[k];
          this.closeTab(k);
        }
      }
    } else {
      delete this.files[path];
      this.closeTab(path);
    }

    this.persist();
    return true;
  }

  // --- 3. Tab Management ---
  openTab(path) {
    if (this.files[path] && !this.files[path].isFolder) {
      if (!this.openTabs.includes(path)) {
        this.openTabs.push(path);
      }
      this.activeFilePath = path;
      this.persist();
      return true;
    }
    return false;
  }

  closeTab(path) {
    const idx = this.openTabs.indexOf(path);
    if (idx !== -1) {
      this.openTabs.splice(idx, 1);
      if (this.activeFilePath === path) {
        this.activeFilePath = this.openTabs.length > 0 ? this.openTabs[Math.max(0, idx - 1)] : null;
      }
      this.persist();
      return true;
    }
    return false;
  }

  // --- 4. Tree Hierarchy Representation ---
  getTreeStructure() {
    const rootName = this.isNativeMode ? this.nativeDirName : 'workspace';
    const tree = { name: rootName, isFolder: true, path: '', children: {} };

    for (const [filePath, info] of Object.entries(this.files)) {
      const cleanPath = filePath.replace(/\/$/, '');
      const parts = cleanPath.split('/');
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = (i === parts.length - 1);
        const subPath = parts.slice(0, i + 1).join('/') + (isLast && info.isFolder ? '/' : '');

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: subPath,
            isFolder: isLast ? info.isFolder : true,
            children: {}
          };
        }
        current = current.children[part];
      }
    }
    return tree;
  }

  // --- 5. Export & Import ---
  downloadFile(path) {
    const file = this.files[path];
    if (!file || file.isFolder) return;
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportZip(zipFileName = 'pycode_project.zip') {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library not loaded');
    }
    const zip = new JSZip();
    for (const [path, info] of Object.entries(this.files)) {
      if (!info.isFolder) {
        zip.file(path, info.content);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importZip(file) {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library not loaded');
    }
    const zip = await JSZip.loadAsync(file);
    const newFiles = {};

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) {
        newFiles[relativePath] = { content: '', isFolder: true };
      } else {
        const content = await zipEntry.async('string');
        newFiles[relativePath] = { content: content, isFolder: false };
      }
    }

    if (Object.keys(newFiles).length > 0) {
      this.files = newFiles;
      this.isNativeMode = false;
      const pyFiles = Object.keys(newFiles).filter(k => !newFiles[k].isFolder && k.endsWith('.py'));
      this.activeFilePath = pyFiles[0] || Object.keys(newFiles).find(k => !newFiles[k].isFolder) || null;
      this.openTabs = this.activeFilePath ? [this.activeFilePath] : [];
      this.persist();
      return true;
    }
    return false;
  }

  resetWorkspace() {
    this.isNativeMode = false;
    this.nativeDirHandle = null;
    this.nativeFileHandles = {};
    localStorage.removeItem(this.storageKey);
    this.loadDefaultWorkspace();
  }
}

// Global VFS singleton
window.vfs = new VirtualFileSystem();
