import { createServing } from './rollup-plugin-express-serve.mjs';
import log from './express-serve-logger.mjs';
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
    describe: `Static folder(s) to serve.
    - Single folder: -f public
    - Multiple folders: -f public,assets
    - Explicit mapping (folder:url): -f public/assets:/assets,public/docs:/docs,public/root:/`,
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
    describe: 'Page/URL to open. Use -o- or --open=false to disable.',
    coerce: (val) => {
      if (typeof val === 'string')
        switch (val.toLowerCase()) {
          case 'false':
          case '-':
            return false;
          case 'true':
          case '+':
            return true;
          default:
            return val; // treat as string path
        }
      else return val === undefined ? true : val;
    },
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
  .help()
  .alias('help', '?') // use -? for help to avoid alias clash
  .strict() // disallow unknown options
  .fail((msg, err, yargs) => {
    log.error(`\nError: ${msg}\n`);
    log.log(yargs.help()); // print the help text
    process.exit(1); // exit with failure
  })
  .parse();

const cwd = process.cwd();
let configPath;

if (argv.config) {
  configPath = path.resolve(cwd, argv.config);
  if (!fs.existsSync(configPath)) {
    log.error(`Error: Config file not found at "${configPath}"`);
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
if (argv.folder !== undefined) {
  const entries = argv.folder
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean); // Split on commas
  // If any entry contains ":", treat as mapping { dir: url }
  if (entries.some((e) => e.includes(':'))) {
    config.contentBase = entries.reduce((acc, entry) => {
      const [dir, url] = entry.split(':');
      acc[dir.trim()] = (url || '/').trim();
      return acc;
    }, {});
  } else if (entries.length > 1) {
    config.contentBase = entries; // string[]
  } else {
    config.contentBase = entries[0]; // string
  }
}

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
