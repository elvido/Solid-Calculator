/**
 * Controller object returned by `createServing`, providing lifecycle and utility methods.
 */
export interface ExpressServeController {
  /**
   * Starts the Express server using the normalized options.
   */
  startServing(): void;

  /**
   * Gracefully stops the server and releases resources.
   */
  stopServing(): Promise<void>;

  /**
   * Prints the resolved content paths and server URL to the console.
   * Only runs if `verbose` is not explicitly set to false.
   */
  printPaths(): void;

  /**
   * Opens the configured page in the default browser.
   * Only runs if `openPage` is defined.
   */
  openPage(): void;
}
