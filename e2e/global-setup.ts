import fs from 'node:fs';
import path from 'node:path';

// Copy doc/db 1.json → e2e/.tmp/db.test.json once before the suite.
// json-server will watch the .tmp copy so user-facing public/db.json stays clean.
export default async function globalSetup() {
  const seedSrc = path.resolve(process.cwd(), 'doc', 'db 1.json');
  const tmpDir = path.resolve(process.cwd(), 'e2e', '.tmp');
  const seedDst = path.resolve(tmpDir, 'db.test.json');

  if (!fs.existsSync(seedSrc)) {
    throw new Error(`[e2e] Seed not found at ${seedSrc}. Cannot run E2E.`);
  }

  fs.mkdirSync(tmpDir, { recursive: true });

  // doc/db 1.json has no ids. json-server requires ids to support DELETE/PATCH by id.
  // Add stable string ids "1".."N" so tests can target tasks deterministically.
  const raw = JSON.parse(fs.readFileSync(seedSrc, 'utf8'));
  const seeded = {
    tasks: raw.tasks.map((t: Record<string, unknown>, i: number) => ({ id: String(i + 1), ...t })),
    states: raw.states,
  };
  fs.writeFileSync(seedDst, JSON.stringify(seeded, null, 2), 'utf8');
}
