/* ==========================================================================
   Queen Rory - Application Entry Point & Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Restore Theme
  const savedTheme = localStorage.getItem('pycode_theme') || 'vscode-dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const qSelect = document.getElementById('quick-theme-select');
  if (qSelect) qSelect.value = savedTheme;
  const sSelect = document.getElementById('settings-theme-select');
  if (sSelect) sSelect.value = savedTheme;
  const themeLabel = document.getElementById('status-theme-name');
  if (themeLabel) themeLabel.textContent = savedTheme;

  // 2. Initialize UI Controller & Terminal
  window.ui.init();
  if (window.terminalManager) {
    window.terminalManager.init();
  }

  // 3. Mount Monaco Editor
  const editorContainer = document.getElementById('monaco-editor-instance');
  try {
    await window.editorManager.init(editorContainer);
    window.editorManager.setTheme(savedTheme);

    // Track Cursor for Status Bar
    window.editorManager.onCursorMove = (line, col) => {
      const posEl = document.getElementById('status-cursor-pos');
      if (posEl) posEl.textContent = `Ln ${line}, Col ${col}`;
    };

    // Open initial active file
    window.ui.openActiveFile();
  } catch (err) {
    console.error('Monaco Editor init failed:', err);
    window.ui.showToast(`Monaco init error: ${err.message}`, 'error');
  }

  // 4. Hook Pyodide Runner Events
  const statusDot = document.getElementById('pyodide-status-dot');
  const statusText = document.getElementById('pyodide-status-text');

  window.pyRunner.onStatusChange = (status, message) => {
    if (statusDot) {
      statusDot.className = 'status-indicator-dot';
      if (status === 'loading' || status === 'running') {
        statusDot.classList.add('loading');
      } else if (status === 'error') {
        statusDot.classList.add('error');
      }
    }
    if (statusText) {
      statusText.textContent = message;
    }
  };

  window.pyRunner.onStdout = (text) => {
    window.ui.appendTerminalLog(text, 'stdout');
  };

  window.pyRunner.onStderr = (text) => {
    window.ui.appendTerminalLog(text, 'stderr');
  };

  // 5. Pre-warm Pyodide in background
  setTimeout(() => {
    window.pyRunner.initPyodide().catch((err) => {
      console.warn('Pyodide background preload warning:', err);
      // 7. Register Service Worker for PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
      }
    });
  }, 100);

  // 6. Populate initial packages list
  window.ui.renderInstalledPackages();

  window.ui.appendTerminalLog('Queen Rory v1.0.0 [Python 3.12 WebAssembly Engine]');
  window.ui.appendTerminalLog('Ready. Press [Run Python] or press F5 / Ctrl+Enter to execute code.\n');
  // 7. Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  }
});

