import { createServing } from './rollup-plugin-express-serve.mjs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

/**
 * @typedef {import('./express-serve-options').ExpressServeOptions} ExpressServeOptions
 */

/**
 * Main entry point for starting the Express server with configuration.
 */

// Parse CLI arguments with Yargs
const argv = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    type: 'string',
    describe: 'Path to config file',
  })
  .option('folder', {
    alias: 'f',
    type: 'string',
    describe: 'Static folders (comma-separated)',
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    describe: 'Port to listen on',
  })
  .option('host', {
    alias: 'h',
    type: 'string',
    describe: 'Host to bind the server to',
  })
  .option('open', {
    alias: 'o',
    type: 'string',
    describe: 'Page or URL to open after server starts',
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    describe: 'Enable verbose logging',
  })
  .option('trace', {
    alias: 't',
    type: 'boolean',
    describe: 'Enable request tracing',
  })
  .parse();

const cwd = process.cwd();
let configPath;

if (argv.config) {
  configPath = path.resolve(cwd, argv.config);
  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file not found at "${configPath}"`);
    process.exit(1);
  }
} else {
  const defaultConfigName = 'express-serve.config';
  const supportedExtensions = ['.mjs', '.js', '.cjs'];

  configPath = supportedExtensions
    .map((ext) => path.resolve(cwd, `${defaultConfigName}${ext}`))
    .find((p) => fs.existsSync(p));
}

/** @type {import('./express-serve-options').ExpressServeOptions} */
let config = {};
if (configPath) {
  const configModule = await import(pathToFileURL(configPath).href);
  config = configModule.default;
}

// Apply CLI overrides
if (argv.verbose !== undefined) config.verbose = argv.verbose;
if (argv.open !== undefined) config.openPage = argv.open;
if (argv.port !== undefined) config.port = argv.port;
if (argv.host !== undefined) config.host = argv.host;
if (argv.trace !== undefined) config.traceRequests = argv.trace;
if (argv.folder !== undefined)
  config.contentBase = argv.folder.includes(',') ? argv.folder.split(',').map((s) => s.trim()) : argv.folder.trim();

// Start server
const serving = createServing(config);

const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGHUP'];
terminationSignals.forEach((signal) => {
  process.on(signal, () => {
    serving.stopServing();
    process.exit();
  });
});

serving.startServing();
serving.printPaths();
serving.openPage();
