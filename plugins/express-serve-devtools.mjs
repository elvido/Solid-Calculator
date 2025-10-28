import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4, validate } from 'uuid';

// Chrome DevTools looks for this well-known endpoint to discover workspace info
const ENDPOINT = '/.well-known/appspecific/com.chrome.devtools.json';

/**
 * Express middleware that serves a DevTools workspace descriptor.
 *
 * @param {{
 *   uuid?: string,                  // UUID string to identify the workspace (or path to persist one)
 *   projectRoot?: string,           // Absolute or relative path to the project root
 *   workspaceData?: string,         // Path to a JSON file holding persisted workspace settings
 *   normalizeForWindowsContainer?: boolean, // Rewrite paths for WSL/Docker so Chrome on Windows can access them
 *   verbose?: boolean               // Enable console logging
 * }} options
 */
export function devtoolsPlugin(options = {}) {
  const router = express.Router();
  const normalizePaths = options.normalizeForWindowsContainer ?? true;

  // Helper logger that only prints if verbose mode is enabled
  const log = (...args) => {
    if (options.verbose) {
      console.log('[DevToolsPlugin]', ...args);
    }
  };

  /**
   * Normalize a project root path so Chrome DevTools can access it.
   * - If running inside WSL, rewrite to UNC path: \\wsl.localhost\<distro>\...
   * - If running inside Docker Desktop, rewrite to UNC path: \\wsl.localhost\docker-desktop-data\...
   * - Otherwise, resolve to an absolute POSIX-style path.
   */
  const normalizePath = (projectRoot) => {
    if (process.env.WSL_DISTRO_NAME) {
      const distro = process.env.WSL_DISTRO_NAME;
      // Strip leading slash so we can join cleanly
      const relativePath = path.posix.relative('/', projectRoot);
      // Build UNC path for WSL
      const rewrittenPath = path.join('\\\\wsl.localhost', distro, relativePath).replace(/\//g, '\\');
      log(`WSL path rewrite: ${rewrittenPath}`);
      return rewrittenPath;
    }
    if (process.env.DOCKER_DESKTOP && !projectRoot.startsWith('\\\\')) {
      // Strip leading slash so we can join cleanly
      const relativePath = path.posix.relative('/', projectRoot);
      // Build UNC path for Docker Desktop
      const rewrittenPath = path.join('\\\\wsl.localhost', 'docker-desktop-data', relativePath).replace(/\//g, '\\');
      log(`Docker path rewrite: ${rewrittenPath}`);
      return rewrittenPath;
    }
    // Default: absolute path with forward slashes
    // Somehow strange with drive letter on windows but with forward slashes
    // but required by chrome and related browsers
    return path.resolve(projectRoot).replace(/\\/g, '/');
  };

  /**
   * Load workspace data from file if it exists, otherwise create it.
   * - Reads from `workspaceData` file if provided.
   * - Falls back to defaults if no file exists.
   * - Ensures a UUID and root path are always present.
   * - Persists a new file if none existed.
   */
  const loadOrCreateWorkspaceData = () => {
    const workspacePath = path.resolve(options.workspaceData ? options.workspaceData : 'chrome.devtools.json');
    let workspace = null;

    // Try to load existing workspace file
    if (fs.existsSync(workspacePath)) {
      try {
        const raw = fs.readFileSync(workspacePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.workspace?.uuid && parsed.workspace?.root) {
          workspace = parsed.workspace;
          log(`Loaded workspace data from "${workspacePath}"`);
        }
      } catch (err) {
        log(`Failed to parse workspaceData file: ${err}`);
      }
    }

    // Determine UUID: prefer option → file → generate new
    const uuid = options.uuid || workspace?.uuid || v4();
    // Determine root: prefer option → file → current working directory
    const root = normalizePath(options.projectRoot || workspace?.root || process.cwd());

    // Final JSON structure DevTools expects
    const devtoolsJson = { workspace: { root, uuid } };

    // If no file existed and no explicit UUID was given, persist the new JSON
    if (!options.uuid && !fs.existsSync(workspacePath)) {
      try {
        fs.mkdirSync(path.dirname(workspacePath), { recursive: true });
        fs.writeFileSync(workspacePath, JSON.stringify(devtoolsJson, null, 2), 'utf-8');
        log(`Created workspaceData file at "${workspacePath}"`);
      } catch (err) {
        log(`Failed to write workspaceData file: ${err}`);
      }
    }

    return devtoolsJson;
  };

  // Register GET handler for the DevTools endpoint
  router.get(ENDPOINT, (req, res) => {
    log('Received DevTools workspace request');
    const devtoolsJson = loadOrCreateWorkspaceData();
    log('Responding with workspace descriptor:', devtoolsJson);
    res.json(devtoolsJson);
  });

  return router;
}
