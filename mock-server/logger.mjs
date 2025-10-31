// Import the shared logger instance from the express serve plugins.
// This logger is proxy-based and supports dynamic configuration, level control, and fallback behavior.
import log from '../plugins/express-serve-logger.mjs';

// Export the logger so it can be reused across the application.
// All modules importing this file will share the same singleton logger instance.
export default log;
