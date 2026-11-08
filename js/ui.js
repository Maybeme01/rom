/* ==========================================================================
   Queen Rory - UI Controller & Event Coordination
   Handles: File Tree rendering, Tabs bar, Splitters resizing, Modals,
            Terminal logs, Toasts, GitHub UI binding, Context Menu,
            Mobile touch navigation, Coding Toolbar & Quick Packages
   ========================================================================== */

class UIController {
  constructor() {
    this.sidebarWidth = 260;
    this.terminalHeight = 220;
    this.isResizingSidebar = false;
    this.isResizingTerminal = false;
    this.activeSidebarPanel = 'explorer';
    this.contextTarget = null; // Path for context menu
  }

  init() {
    this.bindActivityBar();
    this.bindSplitters();
    this.bindHeaderActions();
    this.bindTerminalActions();
    this.bindModals();
    this.bindContextMenu();
    this.bindSettingsPanel();
    this.bindGitHubPanel();
    this.bindGlobalKeyboard();
    this.bindMobileAndTouch();

    if (window.pythonAcademy) {
      window.pythonAcademy.init();
    }

    this.renderTabs();
    this.renderFileTree();
    this.updateBreadcrumbs();
  }

  // --- 1. Activity Bar Navigation ---
  bindActivityBar() {
    const buttons = document.querySelectorAll('.activity-btn[data-panel]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const panelId = btn.getAttribute('data-panel');
        const sidebar = document.getElementById('sidebar');

        if (this.activeSidebarPanel === panelId && !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
          btn.classList.remove('active');
        } else {
          sidebar.classList.remove('collapsed');
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.switchSidebarPanel(panelId);
        }
      });
    });
  }

  switchSidebarPanel(panelId) {
    this.activeSidebarPanel = panelId;
    document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));

    const panel = document.getElementById(`panel-${panelId}`);
    if (panel) panel.classList.add('active');

    const titleEl = document.getElementById('sidebar-panel-title');
    if (titleEl) {
      const titles = {
        'explorer': 'Explorer',
        'academy': '🎓 Python Academy - تعلم بايثون',
        'github': 'GitHub & Cloud Sync',
        'packages': 'Python Packages',
        'settings': 'Settings & Themes',
        'shortcuts': 'Shortcuts & Help'
      };
      titleEl.textContent = titles[panelId] || 'Panel';
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
  }

  toggleTerminal() {
    const terminal = document.getElementById('terminal-panel');
    terminal.classList.toggle('collapsed');
  }

  // --- 2. Resizable Splitters ---
  bindSplitters() {
    const resizerX = document.getElementById('resizer-x');
    const sidebar = document.getElementById('sidebar');

    if (resizerX && sidebar) {
      resizerX.addEventListener('mousedown', (e) => {
        this.isResizingSidebar = true;
        resizerX.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
      });
    }

    const resizerY = document.getElementById('resizer-y');
    const terminal = document.getElementById('terminal-panel');

    if (resizerY && terminal) {
      resizerY.addEventListener('mousedown', (e) => {
        this.isResizingTerminal = true;
        resizerY.classList.add('resizing');
        document.body.style.cursor = 'row-resize';
      });
    }

    window.addEventListener('mousemove', (e) => {
      if (this.isResizingSidebar) {
        const newWidth = Math.max(160, Math.min(e.clientX - 48, 600));
        sidebar.style.width = `${newWidth}px`;
        this.sidebarWidth = newWidth;
      }
      if (this.isResizingTerminal) {
        const windowHeight = window.innerHeight;
        const newHeight = Math.max(60, Math.min(windowHeight - e.clientY - 24, windowHeight * 0.85));
        terminal.style.height = `${newHeight}px`;
        this.terminalHeight = newHeight;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isResizingSidebar) {
        this.isResizingSidebar = false;
        if (resizerX) resizerX.classList.remove('resizing');
        document.body.style.cursor = '';
      }
      if (this.isResizingTerminal) {
        this.isResizingTerminal = false;
        if (resizerY) resizerY.classList.remove('resizing');
        document.body.style.cursor = '';
      }
    });
  }

  // --- 3. Header & Action Bindings ---
  bindHeaderActions() {
    // Run Code Button
    const runBtn = document.getElementById('btn-run-code');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runCurrentCode());
    }

    // Python Academy Button in Titlebar
    const academyNavBtn = document.getElementById('btn-open-academy');
    if (academyNavBtn) {
      academyNavBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) {
          sidebar.classList.remove('collapsed');
        }
        document.querySelectorAll('.activity-btn[data-panel]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-panel') === 'academy');
        });
        this.switchSidebarPanel('academy');
      });
    }

    // Quick Theme Dropdown in Titlebar
    const themeSelect = document.getElementById('quick-theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.changeTheme(e.target.value);
      });
    }

    // Open PC Folder Button (File System Access API)
    const openPcFolderBtn = document.getElementById('btn-open-pc-folder');
    if (openPcFolderBtn) {
      openPcFolderBtn.addEventListener('click', async () => {
        try {
          const res = await window.vfs.openNativeDirectory();
          if (res) {
            this.renderFileTree();
            this.renderTabs();
            this.openActiveFile();
            this.showToast(`Opened folder '${res.name}' (${res.count} files from your PC)`, 'success');
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            this.showToast(err.message, 'error');
          }
        }
      });
    }

    // Save File Button
    const saveBtn = document.getElementById('btn-save-file');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (window.vfs && window.vfs.activeFilePath && window.editorManager) {
          const val = window.editorManager.editor.getValue();
          window.vfs.saveFile(window.vfs.activeFilePath, val);
          this.showToast(`Saved ${window.vfs.activeFilePath}`, 'success');
        }
      });
    }

    // Download Active File to PC
    const downloadActiveBtn = document.getElementById('btn-download-active');
    if (downloadActiveBtn) {
      downloadActiveBtn.addEventListener('click', () => {
        if (window.vfs && window.vfs.activeFilePath) {
          window.vfs.downloadFile(window.vfs.activeFilePath);
          this.showToast(`Downloaded ${window.vfs.activeFilePath} to computer`, 'success');
        }
      });
    }

    // Export ZIP Button
    const zipBtn = document.getElementById('btn-export-zip');
    if (zipBtn) {
      zipBtn.addEventListener('click', async () => {
        try {
          await window.vfs.exportZip('pycode_project.zip');
          this.showToast('Project exported as ZIP successfully!', 'success');
        } catch (err) {
          this.showToast(`Failed to export ZIP: ${err.message}`, 'error');
        }
      });
    }

    // Import Local File Button
    const importFileInput = document.getElementById('input-import-file');
    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          const fileName = file.name;
          window.vfs.createFile(fileName, content);
          window.vfs.openTab(fileName);
          this.renderFileTree();
          this.renderTabs();
          this.openActiveFile();
          this.showToast(`Imported ${fileName} into project`, 'success');
        }
        reader.readAsText(file);
        e.target.value = '';
      });
    }

    // Import ZIP Button
    const importZipInput = document.getElementById('input-import-zip');
    if (importZipInput) {
      importZipInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await window.vfs.importZip(file);
          this.renderFileTree();
          this.renderTabs();
          this.openActiveFile();
          this.showToast('Imported ZIP project successfully!', 'success');
        } catch (err) {
          this.showToast(`Failed to import ZIP: ${err.message}`, 'error');
        }
        e.target.value = '';
      });
    }

    // Fullscreen Toggle
    const fullscreenBtn = document.getElementById('btn-toggle-fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        } else {
          document.exitFullscreen().catch(() => { });
        }
      });
    }
  }

  // --- 4. File Explorer & Tree Rendering ---
  renderFileTree() {
    const container = document.getElementById('file-tree-container');
    if (!container) return;
    container.innerHTML = '';

    const tree = window.vfs.getTreeStructure();

    const buildTreeElements = (node, parentEl) => {
      const keys = Object.keys(node.children).sort((a, b) => {
        const aFolder = node.children[a].isFolder;
        const bFolder = node.children[b].isFolder;
        if (aFolder && !bFolder) return -1;
        if (!aFolder && bFolder) return 1;
        return a.localeCompare(b);
      });

      for (const key of keys) {
        const child = node.children[key];
        const itemEl = document.createElement('div');
        itemEl.className = 'tree-item' + (child.isFolder ? ' folder' : ' file');
        if (window.vfs.activeFilePath === child.path) {
          itemEl.classList.add('active');
        }
        itemEl.setAttribute('data-path', child.path);

        let iconSvg = '';
        if (child.isFolder) {
          iconSvg = `<span class="tree-arrow">▶</span> <span class="item-icon">📁</span>`;
        } else {
          iconSvg = `<span class="tree-arrow"></span> <span class="item-icon">${this.getFileIcon(child.name)}</span>`;
        }

        itemEl.innerHTML = `
          ${iconSvg}
          <span class="item-label" title="${child.path}">${child.name}</span>
          <div class="item-actions">
            ${!child.isFolder ? `<button class="tree-btn-dl" title="Download to PC">⬇️</button>` : ''}
            <button class="tree-btn-del" title="Delete">🗑️</button>
          </div>
        `;

        itemEl.addEventListener('click', (e) => {
          if (e.target.closest('.item-actions')) return;
          if (child.isFolder) {
            itemEl.classList.toggle('open');
            const sub = itemEl.nextElementSibling;
            if (sub && sub.classList.contains('tree-children')) {
              sub.classList.toggle('open');
            }
          } else {
            window.vfs.openTab(child.path);
            this.renderTabs();
            this.renderFileTree();
            this.openActiveFile();

            // On mobile, close drawer upon selecting a file
            if (window.innerWidth <= 768) {
              const sidebar = document.getElementById('sidebar');
              const backdrop = document.getElementById('sidebar-backdrop');
              if (sidebar) sidebar.classList.remove('mobile-open');
              if (backdrop) backdrop.classList.remove('open');
            }
          }
        });

        itemEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY, child.path, child.isFolder);
        });

        const dlBtn = itemEl.querySelector('.tree-btn-dl');
        if (dlBtn) {
          dlBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.vfs.downloadFile(child.path);
            this.showToast(`Downloaded ${child.name}`, 'info');
          });
        }

        const delBtn = itemEl.querySelector('.tree-btn-del');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete '${child.name}'?`)) {
              window.vfs.deleteItem(child.path);
              this.renderFileTree();
              this.renderTabs();
              this.openActiveFile();
              this.showToast(`Deleted ${child.name}`, 'info');
            }
          });
        }

        parentEl.appendChild(itemEl);

        if (child.isFolder) {
          const childrenEl = document.createElement('div');
          childrenEl.className = 'tree-children open';
          itemEl.classList.add('open');
          buildTreeElements(child, childrenEl);
          parentEl.appendChild(childrenEl);
        }
      }
    };

    buildTreeElements(tree, container);
  }

  getFileIcon(filename) {
    if (filename.endsWith('.py')) return '🐍';
    if (filename.endsWith('.json')) return '🔣';
    if (filename.endsWith('.md')) return '📝';
    if (filename.endsWith('.txt')) return '📄';
    if (filename.endsWith('.csv')) return '📊';
    if (filename.endsWith('.html')) return '🌐';
    if (filename.endsWith('.css')) return '🎨';
    if (filename.endsWith('.js')) return '📜';
    return '📄';
  }

  // --- 5. Tabs Bar ---
  renderTabs() {
    const tabsBar = document.getElementById('editor-tabs-bar');
    if (!tabsBar) return;
    tabsBar.innerHTML = '';

    for (const path of window.vfs.openTabs) {
      const tabEl = document.createElement('div');
      tabEl.className = 'editor-tab';
      if (window.vfs.activeFilePath === path) {
        tabEl.classList.add('active');
      }

      const name = path.split('/').pop() || path;
      const icon = this.getFileIcon(name);

      tabEl.innerHTML = `
        <span class="tab-icon">${icon}</span>
        <span class="tab-title" title="${path}">${name}</span>
        <span class="tab-close" title="Close">✕</span>
      `;

      tabEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
          e.stopPropagation();
          window.vfs.closeTab(path);
          this.renderTabs();
          this.renderFileTree();
          this.openActiveFile();
        } else {
          window.vfs.openTab(path);
          this.renderTabs();
          this.renderFileTree();
          this.openActiveFile();
        }
      });

      tabsBar.appendChild(tabEl);
    }

    this.updateBreadcrumbs();
  }

  openActiveFile() {
    const activePath = window.vfs.activeFilePath;
    if (activePath && window.vfs.files[activePath]) {
      const content = window.vfs.files[activePath].content;
      window.editorManager.openFile(activePath, content);
      this.updateBreadcrumbs();
    }
  }

  updateBreadcrumbs() {
    const bc = document.getElementById('breadcrumbs-bar');
    if (!bc) return;
    const path = window.vfs.activeFilePath || '';
    if (!path) {
      bc.innerHTML = '<span class="crumb-item">Queen Rory</span>';
      return;
    }

    const parts = path.split('/');
    let html = '<span class="crumb-item">workspace</span>';
    let curr = '';
    for (const part of parts) {
      curr += (curr ? '/' : '') + part;
      html += ` <span class="crumb-sep">›</span> <span class="crumb-item">${part}</span>`;
    }
    bc.innerHTML = html;
  }

  // --- 6. Python Execution & Terminal Output ---
  async runCurrentCode() {
    const runBtn = document.getElementById('btn-run-code');

    if (!window.vfs.activeFilePath) {
      this.showToast('No active file open to run.', 'warning');
      return;
    }

    // Save editor value to VFS first
    if (window.editorManager && window.editorManager.editor) {
      const content = window.editorManager.editor.getValue();
      window.vfs.saveFile(window.vfs.activeFilePath, content);
    }

    const currentFile = window.vfs.activeFilePath;
    const code = window.vfs.readFile(currentFile);

    // Expand terminal panel if collapsed
    const termPanel = document.getElementById('terminal-panel');
    termPanel.classList.remove('collapsed');

    // Switch to output tab
    if (window.terminalManager) {
      window.terminalManager.switchTab('output');
    }

    // Make Run button pulse
    if (runBtn) {
      runBtn.classList.add('running');
      runBtn.innerHTML = `<span>⏳ Running...</span>`;
    }

    this.appendTerminalLog(`\n--- ▶ Executing: ${currentFile} ---`, 'system');

    try {
      await window.pyRunner.runCode(code, currentFile);
    } catch (err) {
      this.appendTerminalLog(`Execution failed: ${err.message}`, 'stderr');
    } finally {
      if (runBtn) {
        runBtn.classList.remove('running');
        runBtn.innerHTML = `<span>▶ Run Python</span>`;
      }
    }
  }

  ansiToHtml(text) {
    if (!text || typeof text !== 'string') return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const ansiStyles = {
      '0': '',
      '1': 'font-weight: bold;',
      '30': 'color: #555555;',
      '31': 'color: #ff4d4d; font-weight: bold;',
      '32': 'color: #2ecc71;',
      '33': 'color: #f1c40f;',
      '34': 'color: #3498db;',
      '35': 'color: #9b59b6;',
      '36': 'color: #1abc9c;',
      '37': 'color: #ecf0f1;',
      '90': 'color: #7f8c8d;',
      '91': 'color: #ff3838; font-weight: bold; text-shadow: 0 0 8px rgba(255,56,56,0.45);',
      '92': 'color: #2ed573; font-weight: bold;',
      '93': 'color: #ffa502; font-weight: bold; text-shadow: 0 0 6px rgba(255,165,2,0.4);',
      '94': 'color: #1e90ff;',
      '95': 'color: #e056fd;',
      '96': 'color: #70a1ff;',
      '97': 'color: #ffffff; font-weight: bold; text-shadow: 0 0 6px rgba(255,255,255,0.7);'
    };

    const ansiRegex = /(?:\x1b|\u001b|\\x1b|\\033)\[([0-9;]*)m/g;
    let openSpans = 0;

    html = html.replace(ansiRegex, (match, codesStr) => {
      if (!codesStr || codesStr === '0') {
        const closes = '</span>'.repeat(openSpans);
        openSpans = 0;
        return closes;
      }

      const codes = codesStr.split(';');
      let style = '';
      for (const code of codes) {
        if (ansiStyles[code]) {
          style += ansiStyles[code] + ' ';
        }
      }

      if (style) {
        openSpans++;
        return `<span style="${style}">`;
      }
      return '';
    });

    if (openSpans > 0) {
      html += '</span>'.repeat(openSpans);
    }

    return html;
  }

  appendTerminalLog(text, type = 'stdout') {
    const termBody = document.getElementById('terminal-body');
    if (!termBody) return;

    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    if (typeof text === 'string' && (text.includes('\x1b') || text.includes('\u001b') || text.includes('\\x1b') || text.includes('\\033'))) {
      entry.innerHTML = this.ansiToHtml(text);
    } else {
      entry.textContent = text;
    }
    termBody.appendChild(entry);
    termBody.scrollTop = termBody.scrollHeight;
  }

  clearTerminal() {
    const termBody = document.getElementById('terminal-body');
    if (termBody) termBody.innerHTML = '';
    if (window.terminalManager) {
      window.terminalManager.clearTerminal();
    }
  }

  copyTerminalOutput() {
    const termBody = document.getElementById('terminal-body');
    const cliBody = document.getElementById('terminal-cli-history');
    const activeText = (window.terminalManager && window.terminalManager.activeTab === 'terminal')
      ? (cliBody ? cliBody.innerText : '')
      : (termBody ? termBody.innerText : '');

    if (activeText) {
      navigator.clipboard.writeText(activeText).then(() => {
        this.showToast('Terminal output copied to clipboard!', 'info');
      }).catch(() => { });
    }
  }

  bindTerminalActions() {
    const clearBtn = document.getElementById('btn-clear-terminal');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearTerminal());

    const copyBtn = document.getElementById('btn-copy-terminal');
    if (copyBtn) copyBtn.addEventListener('click', () => this.copyTerminalOutput());

    const toggleBtn = document.getElementById('btn-collapse-terminal');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleTerminal());

    const maxBtn = document.getElementById('btn-maximize-terminal');
    const termPanel = document.getElementById('terminal-panel');
    if (maxBtn && termPanel) {
      maxBtn.addEventListener('click', () => {
        termPanel.classList.toggle('maximized');
        maxBtn.textContent = termPanel.classList.contains('maximized') ? '⛶ Restore' : '⛶ Maximize';
      });
    }
  }

  // --- 7. Modals & Context Menus ---
  bindModals() {
    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
        const name = prompt('Enter new file name (e.g. script.py or utils/helper.py):', 'new_script.py');
        if (name) {
          if (window.vfs.createFile(name, '# Python script\n\nprint("Hello from " + __file__)\n')) {
            window.vfs.openTab(name);
            this.renderFileTree();
            this.renderTabs();
            this.openActiveFile();
            this.showToast(`Created file: ${name}`, 'success');
          } else {
            this.showToast('File already exists or invalid name.', 'error');
          }
        }
      });
    }

    const newFolderBtn = document.getElementById('btn-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => {
        const name = prompt('Enter new folder name:', 'modules');
        if (name) {
          if (window.vfs.createFolder(name)) {
            this.renderFileTree();
            this.showToast(`Created folder: ${name}`, 'success');
          } else {
            this.showToast('Folder already exists or invalid name.', 'error');
          }
        }
      });
    }

    const refreshBtn = document.getElementById('btn-refresh-tree');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderFileTree();
        this.showToast('Workspace refreshed', 'info');
      });
    }

    // Package Install Form in Sidebar
    const installPkgBtn = document.getElementById('btn-install-package');
    const pkgInput = document.getElementById('input-package-name');
    if (installPkgBtn && pkgInput) {
      installPkgBtn.addEventListener('click', async () => {
        const pkg = pkgInput.value.trim();
        if (pkg) {
          installPkgBtn.disabled = true;
          installPkgBtn.textContent = '⏳ Installing...';
          await window.pyRunner.installPackage(pkg);
          installPkgBtn.disabled = false;
          installPkgBtn.textContent = '📥 Install Package';
          pkgInput.value = '';
          this.renderInstalledPackages();
        }
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const overlay = e.target.closest('.modal-overlay');
        if (overlay) overlay.classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', (e) => {
        if (e.target === ov) ov.classList.remove('open');
      });
    });
  }

  renderInstalledPackages() {
    const list = document.getElementById('installed-packages-list');
    if (!list) return;
    list.innerHTML = '';
    window.pyRunner.installedPackages.forEach(pkg => {
      const el = document.createElement('div');
      el.className = 'package-item';
      el.innerHTML = `<span>🐍 ${pkg}</span> <span class="package-badge">installed</span>`;
      list.appendChild(el);
    });
  }

  bindContextMenu() {
    const menu = document.getElementById('file-context-menu');
    if (!menu) return;

    window.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    document.getElementById('ctx-rename').addEventListener('click', () => {
      if (!this.contextTarget) return;
      const oldName = this.contextTarget;
      const newName = prompt('Enter new path/name:', oldName);
      if (newName && newName !== oldName) {
        if (window.vfs.renameItem(oldName, newName)) {
          this.renderFileTree();
          this.renderTabs();
          this.openActiveFile();
          this.showToast(`Renamed to ${newName}`, 'success');
        } else {
          this.showToast('Failed to rename item.', 'error');
        }
      }
    });

    document.getElementById('ctx-delete').addEventListener('click', () => {
      if (!this.contextTarget) return;
      if (confirm(`Delete '${this.contextTarget}'?`)) {
        window.vfs.deleteItem(this.contextTarget);
        this.renderFileTree();
        this.renderTabs();
        this.openActiveFile();
        this.showToast(`Deleted ${this.contextTarget}`, 'info');
      }
    });

    document.getElementById('ctx-download').addEventListener('click', () => {
      if (!this.contextTarget) return;
      window.vfs.downloadFile(this.contextTarget);
    });
  }

  showContextMenu(x, y, path, isFolder) {
    const menu = document.getElementById('file-context-menu');
    if (!menu) return;
    this.contextTarget = path;
    menu.style.left = `${Math.min(x, window.innerWidth - 180)}px`;
    menu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;
    menu.style.display = 'block';

    const dlItem = document.getElementById('ctx-download');
    if (dlItem) dlItem.style.display = isFolder ? 'none' : 'flex';
  }

  // --- 8. Settings & Themes ---
  bindSettingsPanel() {
    const themeDropdown = document.getElementById('settings-theme-select');
    if (themeDropdown) {
      themeDropdown.addEventListener('change', (e) => {
        this.changeTheme(e.target.value);
      });
    }

    const fontSizeInput = document.getElementById('settings-font-size');
    if (fontSizeInput) {
      fontSizeInput.addEventListener('change', (e) => {
        window.editorManager.setFontSize(e.target.value);
        this.showToast(`Font size: ${e.target.value}px`, 'info');
      });
    }

    const wordWrapCheck = document.getElementById('settings-word-wrap');
    if (wordWrapCheck) {
      wordWrapCheck.addEventListener('change', (e) => {
        window.editorManager.setWordWrap(e.target.checked);
      });
    }

    const minimapCheck = document.getElementById('settings-minimap');
    if (minimapCheck) {
      minimapCheck.addEventListener('change', (e) => {
        window.editorManager.setMinimap(e.target.checked);
      });
    }

    const lineNumsCheck = document.getElementById('settings-line-numbers');
    if (lineNumsCheck) {
      lineNumsCheck.addEventListener('change', (e) => {
        window.editorManager.setLineNumbers(e.target.checked);
      });
    }

    const resetBtn = document.getElementById('btn-reset-workspace');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset workspace to default files? Any unsaved work will be lost.')) {
          window.vfs.resetWorkspace();
          this.renderFileTree();
          this.renderTabs();
          this.openActiveFile();
          this.showToast('Workspace reset to defaults.', 'warning');
        }
      });
    }
  }

  changeTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    window.editorManager.setTheme(themeName);

    const qSelect = document.getElementById('quick-theme-select');
    if (qSelect) qSelect.value = themeName;
    const sSelect = document.getElementById('settings-theme-select');
    if (sSelect) sSelect.value = themeName;

    const themeLabel = document.getElementById('status-theme-name');
    if (themeLabel) themeLabel.textContent = themeName;

    localStorage.setItem('pycode_theme', themeName);
    this.showToast(`Theme applied: ${themeName}`, 'info');
  }

  // --- 9. GitHub Panel Actions ---
  bindGitHubPanel() {
    const tokenInput = document.getElementById('github-token-input');
    const repoInput = document.getElementById('github-repo-input');
    const branchInput = document.getElementById('github-branch-input');
    const gistIdInput = document.getElementById('github-gist-id-input');

    if (tokenInput) tokenInput.value = window.githubManager.token;
    if (repoInput) repoInput.value = window.githubManager.repo;
    if (branchInput) branchInput.value = window.githubManager.branch;
    if (gistIdInput) gistIdInput.value = window.githubManager.gistId;

    const saveCfgBtn = document.getElementById('btn-save-github-config');
    if (saveCfgBtn) {
      saveCfgBtn.addEventListener('click', () => {
        window.githubManager.saveConfig({
          token: tokenInput.value,
          repo: repoInput.value,
          branch: branchInput.value,
          gistId: gistIdInput.value
        });
        this.updateGitHubStatus();
        this.showToast('GitHub configuration saved!', 'success');
      });
    }

    const saveGistBtn = document.getElementById('btn-save-gist');
    if (saveGistBtn) {
      saveGistBtn.addEventListener('click', async () => {
        try {
          saveGistBtn.disabled = true;
          saveGistBtn.textContent = '⏳ Saving to Gist...';
          const result = await window.githubManager.saveToGist({
            description: 'Queen Rory Project',
            isPublic: false
          });
          if (gistIdInput) gistIdInput.value = result.id;
          this.updateGitHubStatus();
          this.showToast(`Project saved to GitHub Gist! ID: ${result.id}`, 'success');
          this.appendTerminalLog(`[GitHub Cloud] Gist synced: ${result.htmlUrl}`, 'success');
        } catch (err) {
          this.showToast(`Gist Save Error: ${err.message}`, 'error');
        } finally {
          saveGistBtn.disabled = false;
          saveGistBtn.textContent = '☁️ Save to Gist';
        }
      });
    }

    const loadGistBtn = document.getElementById('btn-load-gist');
    if (loadGistBtn) {
      loadGistBtn.addEventListener('click', async () => {
        const id = gistIdInput.value.trim();
        if (!id) {
          this.showToast('Please enter a Gist ID to load.', 'warning');
          return;
        }
        try {
          loadGistBtn.disabled = true;
          loadGistBtn.textContent = '⏳ Loading...';
          const res = await window.githubManager.loadFromGist(id);
          this.renderFileTree();
          this.renderTabs();
          this.openActiveFile();
          this.showToast(`Loaded ${res.fileCount} files from Gist!`, 'success');
        } catch (err) {
          this.showToast(`Load Gist Error: ${err.message}`, 'error');
        } finally {
          loadGistBtn.disabled = false;
          loadGistBtn.textContent = '📥 Load Gist';
        }
      });
    }

    const commitBtn = document.getElementById('btn-commit-repo');
    const commitMsgInput = document.getElementById('github-commit-msg');
    if (commitBtn) {
      commitBtn.addEventListener('click', async () => {
        const msg = (commitMsgInput ? commitMsgInput.value.trim() : '') || 'Update project files from Queen Rory';
        try {
          commitBtn.disabled = true;
          commitBtn.textContent = '⏳ Committing...';
          const res = await window.githubManager.commitProjectToRepo(msg);
          this.updateGitHubStatus();
          this.showToast(`Committed ${res.successCount} files to GitHub repository!`, 'success');
          this.appendTerminalLog(`[GitHub Repo] Pushed files to: ${res.repoUrl}`, 'success');
        } catch (err) {
          this.showToast(`Commit Error: ${err.message}`, 'error');
        } finally {
          commitBtn.disabled = false;
          commitBtn.textContent = '🚀 Push to Repo';
        }
      });
    }

    const cloneBtn = document.getElementById('btn-clone-repo');
    if (cloneBtn) {
      cloneBtn.addEventListener('click', async () => {
        try {
          cloneBtn.disabled = true;
          cloneBtn.textContent = '⏳ Cloning...';
          const res = await window.githubManager.cloneFromRepo();
          this.renderFileTree();
          this.renderTabs();
          this.openActiveFile();
          this.showToast(`Cloned ${res.fileCount} files from repository!`, 'success');
        } catch (err) {
          this.showToast(`Clone Error: ${err.message}`, 'error');
        } finally {
          cloneBtn.disabled = false;
          cloneBtn.textContent = '📥 Clone Repo';
        }
      });
    }

    this.updateGitHubStatus();
  }

  updateGitHubStatus() {
    const statusText = document.getElementById('status-git-branch');
    if (!statusText) return;

    if (window.githubManager.token) {
      if (window.githubManager.repo) {
        statusText.innerHTML = `🐙 ${window.githubManager.repo}:${window.githubManager.branch}`;
      } else if (window.githubManager.gistId) {
        statusText.innerHTML = `☁️ Gist: ${window.githubManager.gistId.slice(0, 8)}...`;
      } else {
        statusText.innerHTML = `🐙 GitHub: Connected`;
      }
    } else {
      statusText.innerHTML = `🐙 Cloud: Local Only`;
    }
  }

  // --- 10. Mobile & Touch Screen Features ---
  bindMobileAndTouch() {
    const mobileMenuBtn = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const closeSidebarMobile = document.getElementById('btn-close-sidebar-mobile');

    if (mobileMenuBtn && sidebar && backdrop) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        backdrop.classList.toggle('open');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('open');
      });

      if (closeSidebarMobile) {
        closeSidebarMobile.addEventListener('click', () => {
          sidebar.classList.remove('mobile-open');
          backdrop.classList.remove('open');
        });
      }
    }

    // Mobile Bottom Navigation Bar Actions
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (action === 'files') {
          this.switchSidebarPanel('explorer');
          if (sidebar) sidebar.classList.add('mobile-open');
          if (backdrop) backdrop.classList.add('open');
        } else if (action === 'academy') {
          this.switchSidebarPanel('academy');
          if (sidebar) sidebar.classList.add('mobile-open');
          if (backdrop) backdrop.classList.add('open');
        } else if (action === 'terminal') {
          const termPanel = document.getElementById('terminal-panel');
          termPanel.classList.remove('collapsed');
          if (window.terminalManager) {
            window.terminalManager.switchTab('terminal');
          }
        } else if (action === 'run') {
          this.runCurrentCode();
        } else if (action === 'github') {
          this.switchSidebarPanel('github');
          if (sidebar) sidebar.classList.add('mobile-open');
          if (backdrop) backdrop.classList.add('open');
        } else if (action === 'settings') {
          this.switchSidebarPanel('settings');
          if (sidebar) sidebar.classList.add('mobile-open');
          if (backdrop) backdrop.classList.add('open');
        }
      });
    });

    // Mobile Quick Coding Toolbar Buttons
    document.querySelectorAll('.mobile-code-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const text = btn.getAttribute('data-insert');
        const offset = parseInt(btn.getAttribute('data-offset') || '0', 10);
        if (window.editorManager) {
          window.editorManager.insertSnippet(text, offset);
        }
      });
    });

    // Quick Install Package Chips
    document.querySelectorAll('.pkg-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const pkg = chip.getAttribute('data-pkg');
        chip.disabled = true;
        const origText = chip.textContent;
        chip.textContent = '⏳ Installing...';
        await window.pyRunner.installPackage(pkg);
        chip.disabled = false;
        chip.textContent = '✅ ' + origText;
        this.renderInstalledPackages();
      });
    });

    // Mobile File Actions inside Explorer drawer
    const mobileDlFile = document.getElementById('btn-mobile-dl-file');
    if (mobileDlFile) {
      mobileDlFile.addEventListener('click', () => {
        if (window.vfs && window.vfs.activeFilePath) {
          window.vfs.downloadFile(window.vfs.activeFilePath);
          this.showToast(`Downloaded ${window.vfs.activeFilePath}`, 'success');
        }
      });
    }

    const mobileDlZip = document.getElementById('btn-mobile-dl-zip');
    if (mobileDlZip) {
      mobileDlZip.addEventListener('click', async () => {
        try {
          await window.vfs.exportZip('pycode_project.zip');
          this.showToast('Project exported as ZIP', 'success');
        } catch (err) {
          this.showToast(`Export error: ${err.message}`, 'error');
        }
      });
    }
  }

  // --- 11. Global Shortcuts ---
  bindGlobalKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        this.runCurrentCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (window.vfs && window.vfs.activeFilePath && window.editorManager) {
          const val = window.editorManager.editor.getValue();
          window.vfs.saveFile(window.vfs.activeFilePath, val);
          this.showToast(`Saved ${window.vfs.activeFilePath} locally`, 'success');
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        this.toggleTerminal();
      }
    });
  }

  // --- 12. Toast Notifications ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };

    toast.innerHTML = `
      <span>${icons[type] || 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global UI singleton
window.ui = new UIController();
