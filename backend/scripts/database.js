import { spawn } from 'node:child_process';
import { inspectDatabase } from './db-safety.js';

const mode = process.argv[2];
if (!['inspect', 'migrate', 'seed'].includes(mode)) throw new Error('Use inspect, migrate, or seed.');
try {
  await inspectDatabase({ write: mode !== 'inspect', migration: mode !== 'seed' });
  if (mode === 'migrate') {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env });
      child.on('error', reject); child.on('exit', resolve);
    });
    process.exitCode = code ?? 1;
  } else if (mode === 'seed') {
    const { runSeed } = await import('../prisma/seed.js');
    await runSeed();
  }
} catch {
  console.error('Database operation stopped. Check local configuration, target confirmation, TLS, and any inspection findings. No reset or destructive shortcut was attempted.');
  process.exitCode = 1;
}
