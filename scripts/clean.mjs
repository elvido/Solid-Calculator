import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { rm } from 'node:fs/promises';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedPaths = ['dist', 'coverage', 'test-results', 'playwright-report', '.eslintcache', '.stylelintcache'];
const dryRun = process.argv.includes('--dry-run');
const fresh = process.argv.includes('--fresh');

// Dependency removal is intentionally opt-in because reinstalling dependencies can be slow.
if (fresh) generatedPaths.push('node_modules');

for (const relativePath of generatedPaths) {
  const target = path.join(projectRoot, relativePath);

  if (dryRun) {
    console.log(`[dry-run] Would remove ${relativePath}`);
  } else {
    await rm(target, { force: true, recursive: true });
    console.log(`Removed ${relativePath}`);
  }
}
