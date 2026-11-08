/* ==========================================================================
   Queen Rory - Monaco Editor Integration & Python IntelliSense
   Supports: VS Code Monaco Editor, Python Autocomplete & Snippets, Custom Themes,
             Multi-model per file tab, Line/Col status tracking, Keybindings
   ========================================================================== */

class EditorManager {
  constructor() {
    this.editor = null;
    this.models = {}; // Key: filePath, Value: monaco.editor.ITextModel
    this.currentTheme = 'vscode-dark';
    this.fontSize = 14;
    this.wordWrap = 'on';
    this.minimap = true;
    this.lineNumbers = 'on';
    this.onCursorMove = null; // (line, col) => {}
    this.onContentChange = null; // (path, content) => {}
  }

  async init(containerElement) {
    return new Promise((resolve, reject) => {
      if (typeof require === 'undefined') {
        return reject(new Error('Monaco AMD loader (require.js) not found.'));
      }

      // Configure AMD loader for Monaco
      require.config({
        paths: {
          'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
        }
      });

      // Avoid caching problems
      window.MonacoEnvironment = {
        getWorkerUrl: function (workerId, label) {
          return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
            self.MonacoEnvironment = {
              baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/'
            };
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/base/worker/workerMain.js');
          `)}`;
        }
      };

      require(['vs/editor/editor.main'], () => {
        try {
          this.registerThemes();
          this.registerPythonCompletions();

          this.editor = monaco.editor.create(containerElement, {
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: this.fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: this.wordWrap,
            minimap: { enabled: this.minimap },
            lineNumbers: this.lineNumbers,
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true }
          });

          // Track cursor position
          this.editor.onDidChangeCursorPosition((e) => {
            if (this.onCursorMove) {
              this.onCursorMove(e.position.lineNumber, e.position.column);
            }
          });

          // Track content changes
          this.editor.onDidChangeModelContent(() => {
            if (window.vfs && window.vfs.activeFilePath) {
              const content = this.editor.getValue();
              window.vfs.saveFile(window.vfs.activeFilePath, content);
              if (this.onContentChange) {
                this.onContentChange(window.vfs.activeFilePath, content);
              }
            }
          });

          // Bind Monaco actions & shortcuts
          this.bindShortcuts();

          resolve(this.editor);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  registerThemes() {
    // 1. VS Code Dark+ (Default)
    monaco.editor.defineTheme('vscode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'identifier', foreground: '9cdcfe' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorCursor.foreground': '#aeafad',
        'editor.lineHighlightBackground': '#282828'
      }
    });

    // 2. VS Code Light+
    monaco.editor.defineTheme('vscode-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000ff' },
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'type', foreground: '267f99' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f3f3f3'
      }
    });

    // 3. Dracula
    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'type', foreground: '8be9fd' },
        { token: 'identifier', foreground: '50fa7b' }
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#44475a'
      }
    });

    // 4. Monokai
    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'f92672' },
        { token: 'string', foreground: 'e6db74' },
        { token: 'number', foreground: 'ae81ff' },
        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
        { token: 'type', foreground: '66d9ef' },
        { token: 'identifier', foreground: 'a6e22e' }
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#3e3d32'
      }
    });

    // 5. One Dark Pro
    monaco.editor.defineTheme('one-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'identifier', foreground: '61afef' }
      ],
      colors: {
        'editor.background': '#282c34',
        'editor.foreground': '#abb2bf',
        'editor.lineHighlightBackground': '#2c313a'
      }
    });

    // 6. GitHub Dark
    monaco.editor.defineTheme('github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'identifier', foreground: '7ee787' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b22'
      }
    });

    // 7. Cyberpunk / Neon
    monaco.editor.defineTheme('cyberpunk', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'ff007f', fontStyle: 'bold' },
        { token: 'string', foreground: '00ffcc' },
        { token: 'number', foreground: 'ffe600' },
        { token: 'comment', foreground: '7a639b', fontStyle: 'italic' },
        { token: 'type', foreground: '00bfff' },
        { token: 'identifier', foreground: 'ff00ff' }
      ],
      colors: {
        'editor.background': '#1a0f30',
        'editor.foreground': '#f0e6ff',
        'editor.lineHighlightBackground': '#28174a'
      }
    });
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    if (monaco && monaco.editor) {
      monaco.editor.setTheme(themeName);
    }
  }

  registerPythonCompletions() {
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          // Python Snippets
          {
            label: 'main',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if __name__ == "__main__":\n    ${1:main()}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Standard Python main boilerplate',
            range
          },
          {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'def ${1:function_name}(${2:params}):\n    """${3:Docstring}"""\n    ${4:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Function definition snippet',
            range
          },
          {
            label: 'class',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'class ${1:ClassName}:\n    def __init__(self, ${2:args}):\n        ${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Class definition snippet',
            range
          },
          {
            label: 'try',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:print(e)}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Try/except block',
            range
          },
          {
            label: 'withopen',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'with open("${1:filename.txt}", "${2:r}") as ${3:f}:\n    ${4:data = f.read()}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Safe file handling context manager',
            range
          },
          {
            label: 'forrange',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for ${1:i} in range(${2:10}):\n    ${3:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'For loop over range',
            range
          },
          {
            label: 'listcomp',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '[${1:x} for ${1:x} in ${2:iterable} if ${3:True}]',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'List comprehension',
            range
          },
          // Built-in functions
          ...[
            'print', 'len', 'range', 'enumerate', 'zip', 'sum', 'min', 'max',
            'abs', 'round', 'isinstance', 'issubclass', 'type', 'id', 'input',
            'open', 'map', 'filter', 'sorted', 'reversed', 'any', 'all',
            'int', 'float', 'str', 'bool', 'list', 'dict', 'set', 'tuple'
          ].map(fn => ({
            label: fn,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: `${fn}(\${1})`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: `Python built-in function: ${fn}()`,
            range
          })),
          // Common modules
          ...[
            'math', 'sys', 'os', 'json', 'random', 'datetime', 're',
            'collections', 'itertools', 'functools', 'urllib', 'time'
          ].map(mod => ({
            label: `import ${mod}`,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: `import ${mod}`,
            documentation: `Import standard library ${mod}`,
            range
          }))
        ];

        return { suggestions };
      }
    });
  }

  getLanguageFromPath(path) {
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.js')) return 'javascript';
    if (path.endsWith('.txt')) return 'plaintext';
    return 'plaintext';
  }

  openFile(path, content) {
    if (!this.editor) return;

    let model = this.models[path];
    const lang = this.getLanguageFromPath(path);

    if (!model) {
      const uri = monaco.Uri.parse(`file:///${path}`);
      model = monaco.editor.getModel(uri) || monaco.editor.createModel(content, lang, uri);
      this.models[path] = model;
    } else {
      if (model.getValue() !== content) {
        model.setValue(content);
      }
    }

    this.editor.setModel(model);
    this.editor.focus();
  }

  bindShortcuts() {
    // F5 or Ctrl+Enter -> Run Python code
    this.editor.addCommand(monaco.KeyCode.F5, () => {
      if (window.ui && window.ui.runCurrentCode) {
        window.ui.runCurrentCode();
      }
    });

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (window.ui && window.ui.runCurrentCode) {
        window.ui.runCurrentCode();
      }
    });

    // Ctrl+S -> Save
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (window.vfs && window.vfs.activeFilePath) {
        const val = this.editor.getValue();
        window.vfs.saveFile(window.vfs.activeFilePath, val);
        if (window.ui) {
          window.ui.showToast('File saved locally (Ctrl+S)', 'success');
        }
      }
    });

    // Ctrl+B -> Toggle Sidebar
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      if (window.ui) window.ui.toggleSidebar();
    });

    // Ctrl+` -> Toggle Terminal
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote, () => {
      if (window.ui) window.ui.toggleTerminal();
    });
  }

  setFontSize(size) {
    this.fontSize = parseInt(size, 10);
    this.editor.updateOptions({ fontSize: this.fontSize });
  }

  setWordWrap(enabled) {
    this.wordWrap = enabled ? 'on' : 'off';
    this.editor.updateOptions({ wordWrap: this.wordWrap });
  }

  setMinimap(enabled) {
    this.minimap = enabled;
    this.editor.updateOptions({ minimap: { enabled: this.minimap } });
  }

  setLineNumbers(enabled) {
    this.lineNumbers = enabled ? 'on' : 'off';
    this.editor.updateOptions({ lineNumbers: this.lineNumbers });
  }

  insertSnippet(text, cursorOffsetFromEnd = 0) {
    if (!this.editor) return;
    const selection = this.editor.getSelection();
    const op = { range: selection, text: text, forceMoveMarkers: true };
    this.editor.executeEdits('mobile-toolbar', [op]);
    if (cursorOffsetFromEnd > 0) {
      const pos = this.editor.getPosition();
      this.editor.setPosition({
        lineNumber: pos.lineNumber,
        column: Math.max(1, pos.column - cursorOffsetFromEnd)
      });
    }
    this.editor.focus();
  }
}

// Global Editor singleton
window.editorManager = new EditorManager();

