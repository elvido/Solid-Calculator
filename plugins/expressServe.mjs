// expressServe.mjs
import { createServing } from './rollup-plugin-express-serve.mjs';
import './types.mjs'; // JSDoc typedefs
import minimist from 'minimist';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

// Parse CLI arguments (--config)
const argv = minimist(process.argv.slice(2), {
  string: ['config'],
  alias: { c: 'config' },
  default: {},
});

const cwd = process.cwd();
let configPath;

if (argv.config) {
  // Use the exact path provided by the user
  configPath = path.resolve(cwd, argv.config);
  if (!fs.existsSync(configPath)) {
    console.error(`Error: Config file not found at "${configPath}"`);
    process.exit(1);
  }
} else {
  // Try fallback filenames with supported extensions for default config
  const defaultConfigName = 'express-serve.config';
  const supportedExtensions = ['.mjs', '.js', '.cjs'];

  configPath = supportedExtensions
    .map((ext) => path.resolve(cwd, `${defaultConfigName}${ext}`))
    .find((p) => fs.existsSync(p));
}

let config = {};
if (configPath) {
  const configModule = await import(pathToFileURL(configPath).href);
  config = configModule.default;
}

const serving = createServing(config);
serving.startServer();

if (config.verbose !== false) {
  serving.printResolvePaths();
}
if (config.open) {
  serving.openPage();
}
