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
 * Configuration options for the logger factory.
 */
export interface LoggerOptions {
  /** Minimum log level */
  level?: 'error' | 'warn' | 'verbose' | 'info' | 'debug';
  /** Optional file path for log output */
  file?: string;
  /** If true, disables all logging */
  silent?: boolean;
}

/**
 * A unified logging interface used throughout the application.
 */
export interface Logger {
  /** Current minimum log level. Messages below this level will be ignored. */
  level: string;

  /** Logs a critical error message. */
  error(...args: any[]): void;

  /** Logs a warning message. */
  warn(...args: any[]): void;

  /** Logs detailed tracing information. */
  verbose(...args: any[]): void;

  /** Logs general application events. */
  info(...args: any[]): void;

  /** Logs development diagnostics. */
  debug(...args: any[]): void;

  /** Generic logging method. Allows dynamic level selection. */
  log(level: string, ...args: any[]): void;
}

export interface ScopedLogger extends Logger {
  withContext(context?: Record<string, unknown>): ScopedLogger;
}

/**
 * A dynamic proxy interface for logging.
 * Wraps a logger instance and exposes logging methods,
 * configuration utilities, and factory registration.
 */
export interface Logging {
  /** Current minimum log level. Can be updated dynamically via assignment. */
  level: 'error' | 'warn' | 'verbose' | 'info' | 'debug';

  /** List of all supported log levels in priority order. */
  levels: string[];

  /**
   * Initializes or reconfigures the logger with the given options.
   * If called again, replaces the current logger instance.
   */
  config(options?: LoggerOptions): Logger;

  /**
   * Registers a custom logger factory function.
   * This replaces the default internal logger behavior.
   * Calling without arguments resets to the default factory.
   */
  register(factoryFn?: (options?: LoggerOptions) => Logger): void;

  /** Logs a critical error message. */
  error(...args: any[]): void;

  /** Logs a warning message. */
  warn(...args: any[]): void;

  /** Logs detailed tracing information. */
  verbose(...args: any[]): void;

  /** Logs general application events. */
  info(...args: any[]): void;

  /** Logs development diagnostics. */
  debug(...args: any[]): void;

  /** Generic logging method. Allows dynamic level selection. */
  log(level: string, ...args: any[]): void;

  /** Creates a logger that automatically adds context metadata. */
  withContext(context?: Record<string, unknown>): ScopedLogger;
}

/**
 * The default exported logger proxy.
 */
declare const log: Logging;
export default log;
