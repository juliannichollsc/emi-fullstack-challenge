// Seeds e2e/.tmp/db.test.json from doc/db 1.json BEFORE Playwright starts the webServer.
// Runs as `pretest:e2e` so it lands before json-server creates its default db.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const seedSrc = path.join(root, 'doc', 'db 1.json');
const tmpDir = path.join(root, 'e2e', '.tmp');
const seedDst = path.join(tmpDir, 'db.test.json');

if (!fs.existsSync(seedSrc)) {
  console.error(`[e2e seed] Source not found: ${seedSrc}`);
  process.exit(1);
}

fs.mkdirSync(tmpDir, { recursive: true });

const raw = JSON.parse(fs.readFileSync(seedSrc, 'utf8'));

// doc/db 1.json has no `id` per task; json-server needs deterministic ids for DELETE/PATCH.
const seeded = {
  tasks: raw.tasks.map((t, i) => ({ id: String(i + 1), ...t })),
  states: raw.states,
};

fs.writeFileSync(seedDst, JSON.stringify(seeded, null, 2), 'utf8');
console.log(`[e2e seed] wrote ${seedDst} (${seeded.tasks.length} tasks, ${seeded.states.length} states)`);
