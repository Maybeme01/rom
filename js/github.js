/* ==========================================================================
   Queen Rory - GitHub Cloud Storage Manager
   Supports: GitHub Personal Access Token (PAT), GitHub Gists (1-click cloud sync),
             GitHub Repositories (Commit & Push, Pull / Clone), Token storage
   ========================================================================== */

class GitHubManager {
  constructor() {
    this.storageKey = 'pycode_github_config_v1';
    this.token = '';
    this.repo = '';       // e.g. "username/my-python-project"
    this.branch = 'main'; // default branch
    this.gistId = '';     // current active gist ID
    this.lastSync = null;
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.token = config.token || '';
        this.repo = config.repo || '';
        this.branch = config.branch || 'main';
        this.gistId = config.gistId || '';
        this.lastSync = config.lastSync || null;
      } catch (e) {
        console.warn('Failed to load GitHub config:', e);
      }
    }
  }

  saveConfig(data) {
    if (data.token !== undefined) this.token = data.token.trim();
    if (data.repo !== undefined) this.repo = data.repo.trim();
    if (data.branch !== undefined) this.branch = data.branch.trim() || 'main';
    if (data.gistId !== undefined) this.gistId = data.gistId.trim();

    localStorage.setItem(this.storageKey, JSON.stringify({
      token: this.token,
      repo: this.repo,
      branch: this.branch,
      gistId: this.gistId,
      lastSync: this.lastSync
    }));
  }

  clearConfig() {
    this.token = '';
    this.repo = '';
    this.branch = 'main';
    this.gistId = '';
    this.lastSync = null;
    localStorage.removeItem(this.storageKey);
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    return headers;
  }

  // --- 1. GIST CLOUD SYNC (Simplest & Most Reliable Cloud Storage) ---
  async saveToGist(options = {}) {
    if (!this.token) {
      throw new Error('Please enter a GitHub Personal Access Token with "gist" permission.');
    }

    const filesPayload = {};
    for (const [path, info] of Object.entries(window.vfs.files)) {
      if (!info.isFolder) {
        // Gist file keys cannot contain slashes; replace slash with __ or dot
        const gistFileName = path.replace(/\//g, '__');
        filesPayload[gistFileName] = {
          content: info.content || '# Empty file'
        };
      }
    }

    if (Object.keys(filesPayload).length === 0) {
      throw new Error('No files found to save in project.');
    }

    const description = options.description || 'Queen Rory Project';
    const isPublic = options.isPublic || false;

    let url = 'https://api.github.com/gists';
    let method = 'POST';

    // If we already have a gist ID, update it
    if (this.gistId) {
      url = `https://api.github.com/gists/${this.gistId}`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method: method,
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: description,
        public: isPublic,
        files: filesPayload
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save to Gist: HTTP ${response.status}`);
    }

    const data = await response.json();
    this.gistId = data.id;
    this.lastSync = new Date().toISOString();
    this.saveConfig({ gistId: this.gistId });

    return {
      id: data.id,
      htmlUrl: data.html_url,
      updatedAt: data.updated_at
    };
  }

  async loadFromGist(gistId) {
    if (!gistId) throw new Error('Please enter a valid Gist ID.');
    const url = `https://api.github.com/gists/${gistId}`;

    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to load Gist: HTTP ${response.status}`);
    }

    const data = await response.json();
    const newFiles = {};

    for (const [rawName, fileData] of Object.entries(data.files || {})) {
      const restoredPath = rawName.replace(/__/g, '/');
      newFiles[restoredPath] = {
        content: fileData.content || '',
        isFolder: false
      };
    }

    if (Object.keys(newFiles).length === 0) {
      throw new Error('Gist contains no readable files.');
    }

    window.vfs.files = newFiles;
    const py = Object.keys(newFiles).find(k => k.endsWith('.py')) || Object.keys(newFiles)[0];
    window.vfs.activeFilePath = py;
    window.vfs.openTabs = [py];
    window.vfs.persist();

    this.gistId = gistId;
    this.saveConfig({ gistId: this.gistId });

    return {
      description: data.description,
      owner: data.owner ? data.owner.login : 'anonymous',
      fileCount: Object.keys(newFiles).length
    };
  }

  // --- 2. REPOSITORY CLOUD SYNC (Commit to GitHub Repo) ---
  async commitProjectToRepo(commitMessage = 'Update files from Queen Rory') {
    if (!this.token) {
      throw new Error('Please enter a GitHub Personal Access Token with "repo" permission.');
    }
    if (!this.repo || !this.repo.includes('/')) {
      throw new Error('Please enter repository in format "owner/repo" (e.g., octocat/hello-world).');
    }

    const [owner, repoName] = this.repo.split('/');
    const branch = this.branch || 'main';

    let successCount = 0;
    const errors = [];

    for (const [path, fileInfo] of Object.entries(window.vfs.files)) {
      if (fileInfo.isFolder) continue;

      try {
        // 1. Check if file already exists to get its SHA
        let sha = null;
        const checkUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}?ref=${branch}`;
        const checkRes = await fetch(checkUrl, { headers: this.getHeaders() });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          sha = checkData.sha;
        }

        // 2. Put file contents (base64 encoded UTF-8)
        const putUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(path)}`;
        const contentBase64 = btoa(unescape(encodeURIComponent(fileInfo.content)));

        const putBody = {
          message: `${commitMessage} (${path})`,
          content: contentBase64,
          branch: branch
        };
        if (sha) {
          putBody.sha = sha;
        }

        const putRes = await fetch(putUrl, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          errors.push(`${path}: ${errData.message || putRes.statusText}`);
        } else {
          successCount++;
        }
      } catch (e) {
        errors.push(`${path}: ${e.message}`);
      }
    }

    this.lastSync = new Date().toISOString();
    this.saveConfig({});

    if (errors.length > 0 && successCount === 0) {
      throw new Error(`Failed to commit files: ${errors.join(', ')}`);
    }

    return {
      successCount,
      errors,
      repoUrl: `https://github.com/${owner}/${repoName}/tree/${branch}`
    };
  }

  async cloneFromRepo() {
    if (!this.repo || !this.repo.includes('/')) {
      throw new Error('Please enter repository as "owner/repo".');
    }
    const [owner, repoName] = this.repo.split('/');
    const branch = this.branch || 'main';

    // Fetch repository Git tree
    const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers: this.getHeaders() });

    if (!treeRes.ok) {
      throw new Error(`Failed to fetch repo tree (HTTP ${treeRes.status}). Verify repo name and branch.`);
    }

    const treeData = await treeRes.json();
    if (!treeData.tree || treeData.tree.length === 0) {
      throw new Error('Repository is empty.');
    }

    const newFiles = {};

    for (const item of treeData.tree) {
      if (item.type === 'blob') {
        // Fetch raw file content
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${item.path}`;
        const rawRes = await fetch(rawUrl, {
          headers: this.token ? { 'Authorization': `token ${this.token}` } : {}
        });
        if (rawRes.ok) {
          const content = await rawRes.text();
          newFiles[item.path] = { content: content, isFolder: false };
        }
      } else if (item.type === 'tree') {
        newFiles[item.path + '/'] = { content: '', isFolder: true };
      }
    }

    if (Object.keys(newFiles).length === 0) {
      throw new Error('No files could be downloaded from repo.');
    }

    window.vfs.files = newFiles;
    const py = Object.keys(newFiles).find(k => k.endsWith('.py')) || Object.keys(newFiles)[0];
    window.vfs.activeFilePath = py;
    window.vfs.openTabs = [py];
    window.vfs.persist();

    return {
      fileCount: Object.keys(newFiles).length,
      repoUrl: `https://github.com/${owner}/${repoName}`
    };
  }
}

// Global GitHub singleton
window.githubManager = new GitHubManager();

