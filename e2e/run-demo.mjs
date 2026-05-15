// Spawns Playwright in demo mode: slow actions, long inter-test pause, red-dot
// visual cursor. Cross-platform (Windows/macOS/Linux) since it sets env vars
// in the Node process before spawning.
import { spawn } from 'node:child_process';

process.env.SLOW_MO = process.env.SLOW_MO ?? '2000';
process.env.INTER_TEST_PAUSE_MS = process.env.INTER_TEST_PAUSE_MS ?? '3000';
process.env.VISUAL_CURSOR = '1';
process.env.HEADLESS = '0';

console.log('[demo] SLOW_MO=%s INTER_TEST_PAUSE_MS=%s VISUAL_CURSOR=1', process.env.SLOW_MO, process.env.INTER_TEST_PAUSE_MS);

const args = ['exec', 'playwright', 'test', ...process.argv.slice(2)];
const child = spawn('pnpm', args, { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
