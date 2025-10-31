/**
 * Creates a logger instance using Winston if available, otherwise falls back
 * to a simple console-based logger. Supports custom log levels and output formats.
 *
 * Winston provides structured logging, colorized output, and file transport.
 * The fallback logger ensures consistent logging behavior even without Winston.
 *
 * Supported log levels:
 * - error   → critical issues
 * - warn    → recoverable problems
 * - verbose → detailed tracing
 * - info    → general application flow
 * - debug   → development diagnostics
 */

/**
 * @typedef {Object} LoggerOptions
 * @property {'error' | 'warn' | 'verbose' | 'info' | 'debug'} [level] - Minimum log level
 * @property {string} [file] - Optional file path for log output
 * @property {boolean} [silent] - If true, disables all logging
 */

/**
 * @typedef {Object} Logger
 * A unified logging interface used throughout the application.
 *
 * @property {string} level - Current minimum log level. Messages below this level will be ignored.
 *
 * @property {(message: string, meta?: any) => void} error
 * Logs a critical error message. Used for unrecoverable failures or exceptions.
 * @example logger.error('Database connection failed', { retry: false });
 *
 * @property {(message: string, meta?: any) => void} warn
 * Logs a warning message. Used for recoverable issues or unexpected behavior.
 * @example logger.warn('Disk space running low', { availableMB: 512 });
 *
 * @property {(message: string, meta?: any) => void} verbose
 * Logs detailed tracing information. Useful for understanding internal flow.
 * @example logger.verbose('User profile loaded', { userId: 'abc123' });
 *
 * @property {(message: string, meta?: any) => void} info
 * Logs general application events. Ideal for business logic and flow tracking.
 * @example logger.info('User logged in', { username: 'ralf' });
 *
 * @property {(message: string, meta?: any) => void} debug
 * Logs development diagnostics. Typically used during debugging or testing.
 * @example logger.debug('Request payload', { body: req.body });
 *
 * @property {(level: string, message: string, meta?: any) => void} log
 * Generic logging method. Allows dynamic level selection.
 * @example logger.log('warn', 'Custom warning', { context: 'auth' });
 */

/**
 * @typedef {Object} Logging
 * A dynamic proxy interface for logging. Wraps a logger instance and exposes logging methods,
 * configuration utilities, and factory registration. Automatically delegates to the current logger.
 *
 * @property {'error' | 'warn' | 'verbose' | 'info' | 'debug'} level
 * Current minimum log level. Messages below this level will be ignored.
 * Can be updated dynamically via assignment.
 * @example log.level = 'debug';
 *
 * @property {string[]} levels
 * List of all supported log levels in priority order.
 * @example log.levels.includes('warn'); // true
 *
 * @property {(options?: LoggerOptions) => Logger} config
 * Initializes or reconfigures the logger with the given options.
 * If called again, replaces the current logger instance.
 * @example log.config({ level: 'info', file: 'app.log' });
 *
 * @property {(factoryFn?: (options?: LoggerOptions) => Logger) => void} register
 * Registers a custom logger factory function. This replaces the default `createLogger` behavior.
 * Calling without arguments resets to the default factory.
 * @example
 * log.register((options) => {
 *   return {
 *     level: options.level ?? 'info',
 *     debug: (msg) => log.log('debug', msg),
 *     info: (msg) => log.log('info', msg),
 *     verbose: (msg) => console.log(`[VERBOSE] ${msg}`),
 *     warn: (msg) => console.warn(`[WARN] ${msg}`),
 *     error: (msg) => console.error(`[ERROR] ${msg}`),
 *     log: (lvl, msg) => console.log(`[${lvl.toUpperCase()}] ${msg}`),
 *   };
 * });
 *
 * @property {(message: string, meta?: any) => void} error
 * Logs a critical error message. Used for unrecoverable failures or exceptions.
 * @example log.error('Database connection failed', { retry: false });
 *
 * @property {(message: string, meta?: any) => void} warn
 * Logs a warning message. Used for recoverable issues or unexpected behavior.
 * @example log.warn('Disk space running low', { availableMB: 512 });
 *
 * @property {(message: string, meta?: any) => void} verbose
 * Logs detailed tracing information. Useful for understanding internal flow.
 * @example log.verbose('User profile loaded', { userId: 'abc123' });
 *
 * @property {(message: string, meta?: any) => void} info
 * Logs general application events. Ideal for business logic and flow tracking.
 * @example log.info('User logged in', { username: 'ralf' });
 *
 * @property {(message: string, meta?: any) => void} debug
 * Logs development diagnostics. Typically used during debugging or testing.
 * @example log.debug('Request payload', { body: req.body });
 *
 * @property {(level: string, message: string, meta?: any) => void} log
 * Generic logging method. Allows dynamic level selection.
 * @example log.log('warn', 'Custom warning', { context: 'auth' });
 */

// Dynamically import a module if available, otherwise return null
async function checkForModule(module) {
  try {
    return await import(module);
  } catch {
    return null;
  }
}

// Try loading Winston and Chalk dynamically
const winstonModule = await checkForModule('winston');
const chalkModule = await checkForModule('chalk');

// Define custom log levels and their numeric priorities
const loggingLevels = {
  levels: {
    error: 0,
    warn: 1,
    verbose: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    verbose: 'green',
    info: 'cyan',
    debug: 'blue',
  },
};

/**
 * Logger factory function.
 * Creates a Winston logger if available, otherwise returns a console-based fallback logger.
 * @param {import('./express-serve-logger').LoggerOptions}  _options - Logger configuration options
 * @returns {import('./express-serve-logger').Logger} - A logger instance
 */
function createLogger(_options = {}) {
  // Normalize and validate options
  const options = {
    level: Object.prototype.hasOwnProperty.call(loggingLevels.levels, _options.level) ? _options.level : 'info',
    file: _options.file,
    silent: _options.silent ? true : false,
  };

  if (winstonModule) {
    // Register custom colors with Winston
    winstonModule.addColors(loggingLevels.colors);

    // Format to uppercase the log level string
    const upperCaseLevel = winstonModule.format((info) => {
      if (typeof info.level === 'string') {
        info.level = info.level.toUpperCase();
      }
      return info;
    });

    // Define text and JSON output formats
    const formats = {
      text: winstonModule.format.combine(
        upperCaseLevel(),
        winstonModule.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winstonModule.format.printf((info) => {
          const rawLevel = info[Symbol.for('level')]; // raw level name
          const colorizer = winstonModule.format.colorize().colorize;
          const ts = colorizer(rawLevel, info.timestamp); // colorized timestamp
          const lv = colorizer(rawLevel, info.level); // colorized level
          return `[${ts} - ${lv}] ${info.message}`;
        })
      ),
      json: winstonModule.format.combine(
        upperCaseLevel(),
        winstonModule.format.timestamp(),
        winstonModule.format.json()
      ),
    };

    // Configure transports based on options
    let transports = [];
    if (!options.silent) transports.push(new winstonModule.transports.Console({ format: formats.text }));
    if (options.file)
      transports.push(new winstonModule.transports.File({ filename: options.file, format: formats.json }));

    // Create and return Winston logger
    const winstonLogger = winstonModule.createLogger({
      levels: loggingLevels.levels,
      level: options.level,
      transports: transports,
    });

    return winstonLogger;
  }
  // Fallback: simple console-based logger with ANSI color support

  class Colorizer {
    constructor() {
      this.ansiColors = {
        // Foreground colors
        black: 30,
        red: 31,
        green: 32,
        yellow: 33,
        blue: 34,
        magenta: 35,
        cyan: 36,
        white: 37,

        // Bright foreground colors
        blackBright: 90,
        redBright: 91,
        greenBright: 92,
        yellowBright: 93,
        blueBright: 94,
        magentaBright: 95,
        cyanBright: 96,
        whiteBright: 97,
      };

      const ansi16Code = (code) => `\x1b[${code}m`;
      const ansi16Reset = `\x1b[0m`;

      // Build color functions
      for (const [name, code] of Object.entries(this.ansiColors)) {
        this[name] = (text) => `${ansi16Code(code)}${text}${ansi16Reset}`;
      }
    }
  }

  // Use chalk if available, otherwise fallback to Colorizer
  const colorizer = chalkModule?.default ?? new Colorizer();

  const levels = loggingLevels.levels;
  const colors = loggingLevels.colors;

  // Core logging function of the ConsoleLogger
  const log = options.silent
    ? () => {}
    : (lvl, msg, meta) => {
        if (levels[lvl] > levels[consoleLogger.level]) return;

        const timestamp = new Date().toISOString();
        const color = colorizer[colors[lvl]]; //chalk[colors[lvl]] ?? chalk.white;
        const label = color(`[${timestamp} - ${lvl.toUpperCase()}]`);

        const output = typeof msg === 'string' ? msg : JSON.stringify(msg);
        const extra = meta ? ` ${JSON.stringify(meta)}` : '';
        const fullMessage = `${label} ${output}${extra}`;

        // Route to appropriate console method
        switch (lvl) {
          case 'error':
            console.error(fullMessage);
            break;
          case 'warn':
            console.warn(fullMessage);
            break;
          default:
            console.log(fullMessage);
            break;
        }
      };

  // Create logger object with mutable methods
  const consoleLogger = {
    level: options.level,
    error: (msg, meta) => log('error', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    verbose: (msg, meta) => log('verbose', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    debug: (msg, meta) => log('debug', msg, meta),
    log: (lvl, msg, meta) => log(lvl, msg, meta),
  };

  return consoleLogger;
}

/**
 * LoggerController manages the lifecycle of a logger instance.
 * It supports lazy initialization, dynamic level changes, and custom factory registration.
 */
class LoggerController {
  constructor() {
    this.loggerInstance = null;
    this.loggerFactory = createLogger;
  }

  // Returns the current logger, initializing if needed
  get logger() {
    return this.loggerInstance ?? this.config();
  }

  // Initializes the logger with options
  config(options = {}) {
    return (this.loggerInstance = this.loggerFactory(options));
  }

  // Register a custom logger factory
  register(factoryFn) {
    if (factoryFn) {
      if (typeof factoryFn !== 'function') throw new Error('Logger factory must be a function');
      this.loggerFactory = factoryFn;
    } else this.loggerFactory = createLogger;
    this.loggerInstance = null;
  }

  // Delegates logging to the appropriate method
  log(level, ...args) {
    const lvl = level !== 'log' ? level : args[0];
    if (Object.prototype.hasOwnProperty.call(loggingLevels.levels, lvl)) {
      return this.logger[level](...args);
    }
    throw new Error(`Unknown logging level: "${lvl}"`);
  }
}

/**
 * Proxy-based logger interface.
 * Wraps a dynamic logger instance and exposes logging methods, configuration utilities,
 * and factory registration. Automatically delegates to the current logger.
 *
 * @type {import('./express-serve-logger').Logging}
 */
const log = new Proxy(new LoggerController(), {
  get(target, prop) {
    if (prop === 'level') return target.logger.level; // Get current log level
    if (prop === 'levels') return Object.keys(loggingLevels.levels); // Return all valid levels
    if (prop === 'config') return (options) => target.config(options); // Initialize with options
    if (prop === 'register') return (fn) => target.register(fn);
    return (...args) => target.log(prop, ...args); // Delegate to logger method
  },
  set(target, prop, value) {
    if (prop === 'level') {
      target.logger.level = value; // Set log level dynamically
      return true;
    }
    throw new Error(`Unknown logger property: "${prop}"`);
  },
});

export default log;
