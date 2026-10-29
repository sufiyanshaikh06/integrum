import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../backend');
const scriptPath = path.resolve(backendDir, 'scripts/test-browser-workflow.ts');

const result = spawnSync(process.execPath, ['--import', 'tsx', scriptPath], {
  cwd: backendDir,
  env: process.env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
