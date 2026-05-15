// Resolves the user's Windows default browser to a Chromium-compatible executable.
// Strategy: read HKCU UrlAssociations → ProgID → expected path map.
// Falls back to Brave / Chrome / Edge / Chromium-flavored browsers in order.
//
// Why Chromium-only: Playwright's `chromium` driver controls any Chromium-based
// binary via executablePath. Firefox/Safari need a different driver and are out
// of scope here — if the user's default is Firefox we fall back to Brave and
// log a notice.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROGID_MAP = {
  BraveHTML:        ['Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
                     'Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
                     'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'],
  ChromeHTML:       ['Program Files\\Google\\Chrome\\Application\\chrome.exe',
                     'Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                     'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'],
  'MSEdgeHTM':      ['Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                     'Program Files\\Microsoft\\Edge\\Application\\msedge.exe'],
  'OperaStable':    ['AppData\\Local\\Programs\\Opera\\opera.exe',
                     'Program Files\\Opera\\opera.exe'],
  'YandexBrowser':  ['AppData\\Local\\Yandex\\YandexBrowser\\Application\\browser.exe'],
  'VivaldiHTM':     ['AppData\\Local\\Vivaldi\\Application\\vivaldi.exe',
                     'Program Files\\Vivaldi\\Application\\vivaldi.exe'],
};

const NOT_CHROMIUM = ['FirefoxURL', 'FirefoxHTML', 'SafariHTML'];

function resolveCandidates(paths) {
  const userProfile = os.homedir();
  const sysDrive = process.env.SystemDrive || 'C:';
  return paths.flatMap((p) => [
    path.join(sysDrive + '\\', p),
    path.join(userProfile, p),
  ]);
}

function firstExisting(candidates) {
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function readDefaultBrowserProgId() {
  if (process.platform !== 'win32') return null;
  try {
    // Use `reg query` rather than direct registry to avoid native deps.
    const out = execFileSync(
      'reg',
      [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice',
        '/v',
        'ProgId',
      ],
      { encoding: 'utf8' },
    );
    const m = out.match(/ProgId\s+REG_SZ\s+(\S+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function resolveDefaultChromium() {
  const progId = readDefaultBrowserProgId();
  const log = [];
  log.push(`[default-browser] ProgId from registry: ${progId ?? 'unknown'}`);

  if (progId && NOT_CHROMIUM.includes(progId)) {
    log.push(`[default-browser] ${progId} is not Chromium-based; falling back to Brave.`);
  } else if (progId && PROGID_MAP[progId]) {
    const exe = firstExisting(resolveCandidates(PROGID_MAP[progId]));
    if (exe) {
      log.push(`[default-browser] using ${progId} → ${exe}`);
      return { exe, source: progId, log };
    }
    log.push(`[default-browser] ${progId} ProgId found but exe missing on disk.`);
  }

  // Fallback chain: Brave → Chrome → Edge.
  for (const id of ['BraveHTML', 'ChromeHTML', 'MSEdgeHTM']) {
    const exe = firstExisting(resolveCandidates(PROGID_MAP[id]));
    if (exe) {
      log.push(`[default-browser] fallback → ${id} at ${exe}`);
      return { exe, source: `fallback:${id}`, log };
    }
  }

  log.push('[default-browser] no Chromium browser found on this system.');
  return { exe: null, source: 'none', log };
}

// CLI: print the path so shell consumers (or sanity checks) can use it.
const isMain = (() => {
  try {
    return fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '');
  } catch {
    return false;
  }
})();

if (isMain) {
  const result = resolveDefaultChromium();
  for (const line of result.log) console.error(line);
  if (result.exe) console.log(result.exe);
  else process.exit(1);
}
