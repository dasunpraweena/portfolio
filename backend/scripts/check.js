import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
function files(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => item.isDirectory() ? files(path.join(directory, item.name)) : item.name.endsWith('.js') ? [path.join(directory, item.name)] : []); }
for (const file of ['prisma.config.js', ...['src', 'scripts', 'prisma', 'tests'].flatMap(files)]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) { console.error(result.stderr); process.exit(1); }
}
console.log('All backend JavaScript files passed syntax checks.');
