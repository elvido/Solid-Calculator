import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidV4, validate as uuidValidate } from 'uuid';
import log from './express-serve-logger.mjs';

// Chrome DevTools looks for this well-known endpoint to discover workspace info
const ENDPOINT = '/.well-known/appspecific/com.chrome.devtools.json';
const DEFAULT_FILE = 'chrome.devtools.json';

/**
 * Express middleware that serves a DevTools workspace descriptor.
 *
 * @param {{
 *   uuid?: string,                  // UUID string to identify the workspace (or path to persist one)
 *   projectRoot?: string,           // Absolute or relative path to the project root
 *   workspaceData?: string,         // Path to a JSON file holding persisted workspace settings
 *   supportWindowsContainer?: boolean, // Rewrite paths for WSL/Docker so Chrome on Windows can access them
 *   verbose?: boolean               // Enable console logging
 * }} options
 */
export function devtoolsPlugin(options = {}) {
  const router = express.Router();
  const supportWindowsContainer = options.supportWindowsContainer ?? true;

  // Helper logger that only prints if verbose mode is enabled
  function logInfo(...args) {
    if (options.verbose) {
      log.verbose('[DevToolsPlugin]', ...args);
    }
  }

  /**
   * Normalize a project root path so Chrome DevTools can access it.
   * - If running inside WSL, rewrite to UNC path: \\wsl.localhost\<distro>\...
   * - If running inside Docker Desktop, rewrite to UNC path: \\wsl.localhost\docker-desktop-data\...
   * - Otherwise, resolve to an absolute POSIX-style path.
   */
  function normalizeWorkspacePath(projectRoot) {
    if (supportWindowsContainer !== false && process.env.WSL_DISTRO_NAME) {
      const distro = process.env.WSL_DISTRO_NAME;
      // Strip leading slash so we can join cleanly
      const relativePath = path.posix.relative('/', projectRoot);
      // Build UNC path for WSL
      const rewrittenPath = path.join('\\\\wsl.localhost', distro, relativePath).replace(/\//g, '\\');
      logInfo(`WSL path rewrite: ${rewrittenPath}`);
      return rewrittenPath;
    }
    if (supportWindowsContainer !== false && process.env.DOCKER_DESKTOP && !projectRoot.startsWith('\\\\')) {
      // Strip leading slash so we can join cleanly
      const relativePath = path.posix.relative('/', projectRoot);
      // Build UNC path for Docker Desktop
      const rewrittenPath = path.join('\\\\wsl.localhost', 'docker-desktop-data', relativePath).replace(/\//g, '\\');
      logInfo(`Docker path rewrite: ${rewrittenPath}`);
      return rewrittenPath;
    }
    // Default: absolute path with forward slashes
    // Somehow strange with drive letter on windows but with forward slashes
    // but required by chrome and related browsers
    return path.resolve(projectRoot).replace(/\\/g, '/');
  }

  /**
   * Load workspace data from file if it exists, otherwise create it.
   * - Reads from `workspaceData` file if provided.
   * - Falls back to defaults if no file exists.
   * - Ensures a UUID and root path are always present.
   * - Persists a new file if none existed.
   */
  function loadOrCreateWorkspaceData() {
    let workspacePath = path.resolve(options.workspaceData || DEFAULT_FILE);
    // If workspaceData is a directory, append default filename
    if (fs.existsSync(workspacePath) && fs.statSync(workspacePath).isDirectory()) {
      workspacePath = path.join(workspacePath, DEFAULT_FILE);
    }

    let workspace = null;
    // Try to load existing workspace file
    if (fs.existsSync(workspacePath)) {
      try {
        const raw = fs.readFileSync(workspacePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.workspace?.uuid && parsed.workspace?.root) {
          workspace = parsed.workspace;
          logInfo(`Loaded workspace data from "${workspacePath}"`);
        }
      } catch (err) {
        logInfo(`Failed to parse workspaceData file: ${err}`);
      }
    }

    // Determine UUID: prefer valid option → valid file → generate new
    let uuid;
    if (options.uuid) {
      if (uuidValidate(options.uuid)) uuid = options.uuid;
      else logInfo(`Invalid UUID provided in options: "${options.uuid}"`);
    }
    if (!uuid && workspace?.uuid) {
      if (uuidValidate(workspace?.uuid)) uuid = workspace?.uuid;
      else logInfo(`Invalid UUID found in workspace file: "${workspace.uuid}"`);
    }
    if (!uuid) {
      uuid = uuidV4();
      logInfo(`Generated new UUID: "${uuid}"`);
    }

    // Determine root: prefer option → file → current working directory
    const root = normalizeWorkspacePath(options.projectRoot || workspace?.root || process.cwd());

    // Final JSON structure DevTools expects
    const devtoolsJson = { workspace: { root, uuid } };

    // If no file existed and no explicit UUID was given, persist the new JSON
    if (!options.uuid && !fs.existsSync(workspacePath)) {
      try {
        fs.mkdirSync(path.dirname(workspacePath), { recursive: true });
        fs.writeFileSync(workspacePath, JSON.stringify(devtoolsJson, null, 2), 'utf-8');
        logInfo(`Created workspaceData file at "${workspacePath}"`);
      } catch (err) {
        logInfo(`Failed to write workspaceData file: ${err}`);
      }
    }

    return devtoolsJson;
  }

  // Register GET handler for the DevTools endpoint
  router.get(ENDPOINT, (req, res) => {
    logInfo('Received DevTools workspace request');
    const devtoolsJson = loadOrCreateWorkspaceData();
    logInfo('Responding with workspace descriptor:', devtoolsJson);
    res.setHeader('x-trace-source', 'devtools');
    res.json(devtoolsJson);
  });

  return router;
}
