/* ==========================================================================
   Queen Rory - Interactive Terminal & Shell Controller
   Supports: Real CLI prompt with cwd tracking (cd, pwd, ls, mkdir, rm, touch, mv, cp),
             Command history (↑ / ↓), Tab autocompletion, 'python <file>',
             'python' interactive REPL (>>>), 'pip install <pkg>', 'pip list'
   ========================================================================== */

class TerminalController {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.isReplMode = false;
    this.replBuffer = [];
    this.activeTab = 'terminal'; // 'terminal', 'repl', 'output', 'plots'
    this.currentDir = '';       // Empty string = root (/workspace)
  }

  init() {
    this.bindEvents();
    this.renderWelcome();
    this.updatePromptUI();
  }

  bindEvents() {
    const input = document.getElementById('terminal-cli-input');
    if (!input) return;

    input.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Focus input when clicking anywhere in terminal body
    const body = document.getElementById('terminal-body-cli');
    if (body) {
      body.addEventListener('click', () => {
        input.focus();
      });
    }

    // Tab buttons in Terminal header
    document.querySelectorAll('.term-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.term-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.terminal-view-pane').forEach(v => v.classList.remove('active'));

    const activeBtn = document.querySelector(`.term-tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const activePane = document.getElementById(`term-pane-${tabName}`);
    if (activePane) activePane.classList.add('active');

    if (tabName === 'terminal') {
      const input = document.getElementById('terminal-cli-input');
      if (input) input.focus();
    }
  }

  renderWelcome() {
    this.printLine('Queen Rory Terminal [Version 1.3.0]', 'term-system');
    this.printLine('Connected to Python 3.12 WebAssembly environment.', 'term-muted');
    this.printLine('Type "help" to see available shell commands, or "python" to start REPL.\n', 'term-info');
  }

  printLine(text, className = '') {
    const outputContainer = document.getElementById('terminal-cli-history');
    if (!outputContainer) return;

    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    if (typeof text === 'string' && (text.includes('\x1b') || text.includes('\u001b') || text.includes('\\x1b') || text.includes('\\033'))) {
      line.innerHTML = (window.ui && window.ui.ansiToHtml) ? window.ui.ansiToHtml(text) : text;
    } else {
      line.textContent = text;
    }
    outputContainer.appendChild(line);

    const body = document.getElementById('terminal-body-cli');
    if (body) body.scrollTop = body.scrollHeight;
  }

  printRawHTML(html) {
    const outputContainer = document.getElementById('terminal-cli-history');
    if (!outputContainer) return;

    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = html;
    outputContainer.appendChild(line);

    const body = document.getElementById('terminal-body-cli');
    if (body) body.scrollTop = body.scrollHeight;
  }

  // --- Path Resolution Helper ---
  resolvePath(target) {
    if (!target || target === '.') {
      return this.currentDir;
    }
    if (target === '~' || target === '/' || target === '/workspace') {
      return '';
    }

    let base = target.startsWith('/') ? '' : this.currentDir;
    let full = base ? `${base}/${target}` : target;
    full = full.replace(/^\/+/, '').replace(/\/+$/, '');

    const parts = full.split('/');
    const stack = [];

    for (let part of parts) {
      part = part.trim();
      if (!part || part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }

    return stack.join('/');
  }

  getDisplayPrompt() {
    const dirStr = this.currentDir ? `/${this.currentDir}` : '';
    return `<span class="prompt-user">user@pycode</span>:<span class="prompt-path">~/workspace${dirStr}</span>$ `;
  }

  updatePromptUI() {
    const label = document.getElementById('terminal-cli-prompt-label');
    if (!label) return;

    if (this.isReplMode) {
      label.innerHTML = '<span class="prompt-repl">>>> </span>';
    } else {
      label.innerHTML = this.getDisplayPrompt();
    }
  }

  // --- Keyboard Handling (History, Autocomplete, Run) ---
  async handleKeydown(e) {
    const input = document.getElementById('terminal-cli-input');
    if (!input) return;

    // Up Arrow: History backward
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length === 0) return;
      if (this.historyIndex === -1) {
        this.historyIndex = this.history.length - 1;
      } else if (this.historyIndex > 0) {
        this.historyIndex--;
      }
      input.value = this.history[this.historyIndex] || '';
      return;
    }

    // Down Arrow: History forward
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex !== -1) {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          input.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = -1;
          input.value = '';
        }
      }
      return;
    }

    // Tab: Autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      this.handleTabAutocomplete(input);
      return;
    }

    // Enter: Execute Command
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawCommand = input.value;
      input.value = '';
      this.historyIndex = -1;

      if (rawCommand.trim()) {
        this.history.push(rawCommand);
      }

      await this.processCommand(rawCommand);
    }
  }

  handleTabAutocomplete(input) {
    const val = input.value;
    const tokens = val.split(' ');
    const lastToken = tokens[tokens.length - 1];

    if (!lastToken) return;

    // 1. Suggest shell commands
    if (tokens.length === 1) {
      const commands = ['python', 'pip', 'cd', 'ls', 'dir', 'cat', 'touch', 'mkdir', 'rm', 'mv', 'cp', 'clear', 'pwd', 'help', 'whoami', 'hostname', 'date', 'echo', 'history'];
      const matches = commands.filter(c => c.startsWith(lastToken.toLowerCase()));
      if (matches.length === 1) {
        input.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        this.printLine(matches.join('  '), 'term-muted');
      }
      return;
    }

    // 2. Suggest files/folders in currentDir
    if (window.vfs && window.vfs.files) {
      const prefix = this.currentDir ? `${this.currentDir}/` : '';
      const localMatches = [];

      for (const path of Object.keys(window.vfs.files)) {
        if (this.currentDir && !path.startsWith(prefix)) continue;
        const sub = this.currentDir ? path.slice(prefix.length) : path;
        const firstSegment = sub.split('/')[0];
        if (firstSegment.startsWith(lastToken) && !localMatches.includes(firstSegment)) {
          localMatches.push(firstSegment);
        }
      }

      if (localMatches.length === 1) {
        tokens[tokens.length - 1] = localMatches[0];
        input.value = tokens.join(' ') + ' ';
      } else if (localMatches.length > 1) {
        this.printLine(localMatches.join('  '), 'term-muted');
      }
    }
  }

  async processCommand(rawCommand) {
    const promptDisplay = this.isReplMode ? '>>> ' : `user@pycode:~/workspace${this.currentDir ? '/' + this.currentDir : ''}$ `;
    this.printLine(promptDisplay + rawCommand, 'term-prompt-echo');

    const cmd = rawCommand.trim();
    if (!cmd) return;

    // --- A. Python REPL Mode Handling ---
    if (this.isReplMode) {
      if (cmd === 'exit()' || cmd === 'quit()' || cmd === 'exit') {
        this.isReplMode = false;
        this.updatePromptUI();
        this.printLine('Exited Python REPL.', 'term-info');
        return;
      }
      if (cmd === 'clear' || cmd === 'clear()') {
        this.clearTerminal();
        return;
      }

      try {
        const out = await window.pyRunner.runInteractive(cmd);
        if (out) {
          this.printLine(out, 'term-stdout');
        }
      } catch (err) {
        this.printLine(`Traceback (most recent call last):\n${err.message}`, 'term-stderr');
      }
      return;
    }

    // --- B. Shell CLI Commands Handling ---
    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCmd) {
      case 'help':
        this.printLine(`Available Commands:
  cd <dir>            - Change directory (e.g. cd 33, cd .., cd ~)
  pwd                 - Print working directory
  ls / dir            - List files and directories in current folder
  python <file.py>    - Run a python script (e.g. python main.py)
  python              - Start interactive Python REPL session (>>>)
  pip install <pkg>   - Install package from PyPI or Pyodide (e.g. pip install numpy)
  pip list            - View installed Python packages
  cat <file>          - Print contents of a file
  touch <file>        - Create a new file
  mkdir <dir>         - Create a new folder
  rm <file>           - Delete a file or folder
  mv <old> <new>      - Rename or move file
  cp <src> <dest>     - Copy file
  whoami / hostname   - Show current user and host
  echo <text>         - Print text to screen
  history             - View command history
  clear / cls         - Clear terminal screen
  date                - Display current date and time
  help                - Show this help message
`, 'term-info');
        break;

      case 'cd':
        const target = args[0] ? args[0].trim() : '~';
        if (target === '~' || target === '/' || target === '/workspace') {
          this.currentDir = '';
          this.updatePromptUI();
          break;
        }

        const resolved = this.resolvePath(target);
        if (resolved === '') {
          this.currentDir = '';
          this.updatePromptUI();
          break;
        }

        // Check if directory exists in VFS
        const folderKey = resolved.endsWith('/') ? resolved : resolved + '/';
        const existsAsFolder = window.vfs.files[folderKey] || Object.keys(window.vfs.files).some(k => k.startsWith(folderKey));

        if (existsAsFolder) {
          this.currentDir = resolved;
          this.updatePromptUI();
        } else {
          this.printLine(`cd: no such file or directory: ${args[0]}`, 'term-stderr');
        }
        break;

      case 'pwd':
        this.printLine(`/workspace${this.currentDir ? '/' + this.currentDir : ''}`, 'term-stdout');
        break;

      case 'ls':
      case 'dir':
        if (window.vfs && window.vfs.files) {
          const prefix = this.currentDir ? `${this.currentDir}/` : '';
          const itemsMap = new Map();

          for (const [path, info] of Object.entries(window.vfs.files)) {
            if (this.currentDir) {
              if (!path.startsWith(prefix)) continue;
              const sub = path.slice(prefix.length);
              if (!sub) continue;
              const seg = sub.split('/')[0];
              const isFolder = sub.includes('/') || info.isFolder;
              itemsMap.set(seg, isFolder);
            } else {
              const seg = path.split('/')[0];
              const isFolder = path.includes('/') || info.isFolder;
              itemsMap.set(seg, isFolder);
            }
          }

          if (itemsMap.size === 0) {
            this.printLine('(directory is empty)', 'term-muted');
          } else {
            let outputHtml = '<div style="display: flex; flex-wrap: wrap; gap: 14px; margin: 4px 0;">';
            const sortedKeys = Array.from(itemsMap.keys()).sort((a, b) => {
              const aFolder = itemsMap.get(a);
              const bFolder = itemsMap.get(b);
              if (aFolder && !bFolder) return -1;
              if (!aFolder && bFolder) return 1;
              return a.localeCompare(b);
            });

            for (const key of sortedKeys) {
              const isFolder = itemsMap.get(key);
              const icon = isFolder ? '📁' : (key.endsWith('.py') ? '🐍' : '📄');
              const color = isFolder ? '#58a6ff' : (key.endsWith('.py') ? '#4ec9b0' : '#cccccc');
              outputHtml += `<span style="color: ${color}; font-weight: 500;">${icon} ${key}${isFolder ? '/' : ''}</span>`;
            }
            outputHtml += '</div>';
            this.printRawHTML(outputHtml);
          }
        }
        break;

      case 'cat':
      case 'type':
        if (!args[0]) {
          this.printLine('Usage: cat <filename>', 'term-stderr');
        } else {
          const resolvedPath = this.resolvePath(args[0]);
          const content = window.vfs.readFile(resolvedPath);
          if (content !== null) {
            this.printLine(content, 'term-stdout');
          } else {
            this.printLine(`cat: ${args[0]}: No such file`, 'term-stderr');
          }
        }
        break;

      case 'touch':
        if (!args[0]) {
          this.printLine('Usage: touch <filename>', 'term-stderr');
        } else {
          const resolvedPath = this.resolvePath(args[0]);
          if (window.vfs.createFile(resolvedPath, '')) {
            this.printLine(`Created file: ${resolvedPath}`, 'term-stdout');
            if (window.ui) window.ui.renderFileTree();
          } else {
            this.printLine(`touch: cannot create ${args[0]}: File already exists`, 'term-stderr');
          }
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          this.printLine('Usage: mkdir <foldername>', 'term-stderr');
        } else {
          const resolvedPath = this.resolvePath(args[0]);
          if (window.vfs.createFolder(resolvedPath)) {
            this.printLine(`Created directory: ${resolvedPath}/`, 'term-stdout');
            if (window.ui) window.ui.renderFileTree();
          } else {
            this.printLine(`mkdir: cannot create directory '${args[0]}': Directory already exists`, 'term-stderr');
          }
        }
        break;

      case 'rm':
        if (!args[0]) {
          this.printLine('Usage: rm <filename>', 'term-stderr');
        } else {
          const resolvedPath = this.resolvePath(args[0]);
          if (window.vfs.deleteItem(resolvedPath)) {
            this.printLine(`Removed: ${resolvedPath}`, 'term-stdout');
            if (window.ui) {
              window.ui.renderFileTree();
              window.ui.renderTabs();
              window.ui.openActiveFile();
            }
          } else {
            this.printLine(`rm: cannot remove '${args[0]}': No such file or directory`, 'term-stderr');
          }
        }
        break;

      case 'mv':
        if (args.length < 2) {
          this.printLine('Usage: mv <source> <destination>', 'term-stderr');
        } else {
          const src = this.resolvePath(args[0]);
          const dest = this.resolvePath(args[1]);
          if (window.vfs.renameItem(src, dest)) {
            this.printLine(`Renamed '${args[0]}' -> '${args[1]}'`, 'term-stdout');
            if (window.ui) {
              window.ui.renderFileTree();
              window.ui.renderTabs();
              window.ui.openActiveFile();
            }
          } else {
            this.printLine(`mv: cannot move '${args[0]}' to '${args[1]}'`, 'term-stderr');
          }
        }
        break;

      case 'cp':
        if (args.length < 2) {
          this.printLine('Usage: cp <source> <destination>', 'term-stderr');
        } else {
          const src = this.resolvePath(args[0]);
          const dest = this.resolvePath(args[1]);
          const content = window.vfs.readFile(src);
          if (content !== null) {
            window.vfs.createFile(dest, content);
            this.printLine(`Copied '${args[0]}' -> '${args[1]}'`, 'term-stdout');
            if (window.ui) window.ui.renderFileTree();
          } else {
            this.printLine(`cp: cannot stat '${args[0]}': No such file`, 'term-stderr');
          }
        }
        break;

      case 'python':
      case 'python3':
        if (args.length === 0) {
          this.isReplMode = true;
          this.updatePromptUI();
          this.printLine(`Python 3.12 (Pyodide WebAssembly) [Interactive Mode]`, 'term-info');
          this.printLine(`Type "help()", "copyright", "credits" or "exit()" to leave.\n`, 'term-muted');
        } else if (args[0] === '--version' || args[0] === '-V') {
          this.printLine('Python 3.12.5 (Pyodide WebAssembly, GCC 13.2 Emscripten)', 'term-stdout');
        } else {
          let scriptFile = this.resolvePath(args[0]);
          let code = window.vfs.readFile(scriptFile);
          if (code === null && !args[0].startsWith('/')) {
            // Check root workspace
            code = window.vfs.readFile(args[0]);
            if (code !== null) scriptFile = args[0];
          }

          if (code === null) {
            this.printLine(`python: can't open file '${args[0]}': [Errno 2] No such file`, 'term-stderr');
          } else {
            this.printLine(`[Executing ${scriptFile}...]`, 'term-system');

            const origStdout = window.pyRunner.onStdout;
            const origStderr = window.pyRunner.onStderr;

            window.pyRunner.onStdout = (text) => this.printLine(text.replace(/\n$/, ''), 'term-stdout');
            window.pyRunner.onStderr = (text) => this.printLine(text.replace(/\n$/, ''), 'term-stderr');

            try {
              await window.pyRunner.runCode(code, scriptFile);
            } finally {
              window.pyRunner.onStdout = origStdout;
              window.pyRunner.onStderr = origStderr;
            }
          }
        }
        break;

      case 'pip':
        const sub = args[0] ? args[0].toLowerCase() : '';
        if (!sub || sub === 'help' || sub === '-h' || sub === '--help') {
          this.printLine(`Usage:
  pip <command> [options]

Commands:
  install <package>   Install packages from PyPI or Pyodide
  list                List installed packages
  --version, -V       Show pip version`, 'term-info');
          break;
        }

        if (sub === '--version' || sub === '-v') {
          this.printLine('pip 24.1 from /lib/python3.12/site-packages/micropip (python 3.12)', 'term-stdout');
          break;
        }

        if (sub === 'install') {
          const pkg = args[1];
          if (!pkg) {
            this.printLine('Usage: pip install <package_name>', 'term-stderr');
          } else {
            this.printLine(`Collecting ${pkg}...`, 'term-system');

            const origStdout = window.pyRunner.onStdout;
            const origStderr = window.pyRunner.onStderr;

            window.pyRunner.onStdout = (text) => this.printLine(text.replace(/\n$/, ''), 'term-stdout');
            window.pyRunner.onStderr = (text) => this.printLine(text.replace(/\n$/, ''), 'term-stderr');

            try {
              await window.pyRunner.installPackage(pkg);
              if (window.ui) window.ui.renderInstalledPackages();
            } finally {
              window.pyRunner.onStdout = origStdout;
              window.pyRunner.onStderr = origStderr;
            }
          }
        } else if (sub === 'list') {
          this.printLine('Package           Version', 'term-info');
          this.printLine('----------------  -------', 'term-muted');
          window.pyRunner.installedPackages.forEach(p => {
            this.printLine(`${p.padEnd(16)} (in-browser)`, 'term-stdout');
          });
        } else {
          this.printLine(`pip: unknown command '${args[0]}'. Try: pip install <package> or pip list`, 'term-stderr');
        }
        break;

      case 'whoami':
        this.printLine('user', 'term-stdout');
        break;

      case 'hostname':
        this.printLine('pycode-pc', 'term-stdout');
        break;

      case 'uname':
        this.printLine('Linux pycode-pc 6.1.0-wasm WebAssembly x86_64 GNU/Linux', 'term-stdout');
        break;

      case 'which':
        if (!args[0]) {
          this.printLine('Usage: which <command>', 'term-stderr');
        } else if (args[0] === 'python' || args[0] === 'python3') {
          this.printLine('/usr/bin/python3', 'term-stdout');
        } else if (args[0] === 'pip') {
          this.printLine('/usr/bin/pip', 'term-stdout');
        } else {
          this.printLine(`${args[0]} not found in PATH`, 'term-stderr');
        }
        break;

      case 'history':
        this.history.forEach((h, idx) => {
          this.printLine(`  ${String(idx + 1).padStart(3, ' ')}  ${h}`, 'term-muted');
        });
        break;

      case 'echo':
        this.printLine(args.join(' '), 'term-stdout');
        break;

      case 'date':
        this.printLine(new Date().toString(), 'term-stdout');
        break;

      case 'clear':
      case 'cls':
        this.clearTerminal();
        break;

      default:
        this.printLine(`pycode: command not found: ${mainCmd}. Type 'help' for available commands.`, 'term-stderr');
        break;
    }
  }

  clearTerminal() {
    const historyContainer = document.getElementById('terminal-cli-history');
    if (historyContainer) historyContainer.innerHTML = '';
  }
}

// Global Terminal singleton
window.terminalManager = new TerminalController();
