/**
 * fetch-asset.mjs — Hardened brand-asset downloader.
 * Zero npm dependencies; uses only node: builtins.
 *
 * Security validations (each comment below cites the threat):
 *   1  Host allowlist       → SSRF / data exfiltration
 *   2  HTTPS-only           → MITM / protocol downgrade
 *   3  Content-Type allow   → XSS via SVG <script>
 *   4  Magic bytes          → Content-Type spoofing
 *   5  Max size             → DoS (disk / memory)
 *   6  Redirect revalidate  → Open redirect to malicious host
 *   7  Path sanitize        → Path traversal
 *   8  No cookie jar        → Token leakage
 *   9  Write-only output    → RCE
 */

import https from 'node:https';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import process from 'node:process';

// ---------------------------------------------------------------------------
// Repo root — resolved relative to this script's location
// (.claude/skills/asset-fetcher/scripts/ → up 4 levels)
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const BRAND_DIR = path.resolve(REPO_ROOT, 'public', 'brand');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Threat 1: Host allowlist — split into two sets to prevent suffix-wildcard
 * from accidentally matching unrelated domains that share a suffix.
 *
 * EXACT_HOSTS: literal hostname match (case-insensitive).
 * SUFFIX_HOSTS: any subdomain ending with this suffix is accepted.
 *   - Only `.grupoemi.com` is here; *.blob.core.windows.net is NOT,
 *     because that would open access to tens of millions of public blobs.
 */

/** Exact-match hosts — added nominally, one-by-one, with deliberate justification. */
const EXACT_HOSTS = new Set([
  'grupoemi.com',
  'www.grupoemi.com',
  // CDN where Grupo EMI Falck's Next.js site (grupoemi.com/colombia) hosts its
  // brand assets (logo, images). Added as a nominal exact-host exception because
  // the Azure Blob Storage hostname is generic and broad suffix-matching against
  // *.blob.core.windows.net would expose tens of millions of unrelated public blobs.
  'stpaginawebpdn.blob.core.windows.net',
]);

/** Suffix-match hosts — any subdomain ending with the listed suffix is accepted. */
const SUFFIX_HOSTS = [
  '.grupoemi.com', // covers cdn.grupoemi.com, assets.grupoemi.com, etc.
];

/** Threat 3: allowed MIME types — SVG is intentionally absent */
const ALLOWED_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

// ---------------------------------------------------------------------------
// AssetFetchError
// ---------------------------------------------------------------------------
export class AssetFetchError extends Error {
  /**
   * @param {string} message
   * @param {string} code
   */
  constructor(message, code) {
    super(message);
    this.name = 'AssetFetchError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Threat 1: Validate that a hostname is within the allowlist.
 * Checks EXACT_HOSTS first (literal match), then SUFFIX_HOSTS (subdomain suffix).
 * Comparison is case-insensitive.
 * @param {string} hostname
 * @returns {boolean}
 */
function isHostAllowed(hostname) {
  const h = hostname.toLowerCase();
  if (EXACT_HOSTS.has(h)) return true;
  return SUFFIX_HOSTS.some((suffix) => h.endsWith(suffix));
}

/**
 * Threat 7: Sanitize a destination filename/path.
 * Returns the resolved absolute path inside BRAND_DIR.
 * Throws AssetFetchError if the result escapes BRAND_DIR.
 * @param {string} destPath — relative filename or absolute path
 * @returns {string} absolute path
 */
function sanitizeDest(destPath) {
  // If it's already absolute, use as-is; otherwise resolve relative to BRAND_DIR.
  const candidate = path.isAbsolute(destPath)
    ? destPath
    : path.resolve(BRAND_DIR, destPath);

  const resolved = path.resolve(candidate);

  // The filename component must match the safe pattern.
  const basename = path.basename(resolved);
  if (!/^[a-zA-Z0-9._-]+$/.test(basename)) {
    throw new AssetFetchError(
      `dest filename contains unsafe characters: ${basename}`,
      'PATH_TRAVERSAL',
    );
  }

  // Threat 7: Assert containment.
  const brandDirResolved = path.resolve(BRAND_DIR);
  if (!resolved.startsWith(brandDirResolved + path.sep) && resolved !== brandDirResolved) {
    throw new AssetFetchError(
      `dest resolves outside public/brand: ${resolved}`,
      'PATH_TRAVERSAL',
    );
  }

  return resolved;
}

/**
 * Threat 4: Validate magic bytes of a Buffer against the declared MIME type.
 * @param {Buffer} buf — first 12 bytes of the response are sufficient.
 * @param {string} contentType — normalised (lowercased, no params).
 * @returns {boolean}
 */
function checkMagicBytes(buf, contentType) {
  if (buf.length < 4) return false;

  switch (contentType) {
    case 'image/png':
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      );

    case 'image/jpeg':
    case 'image/jpg':
      // JPEG: FF D8 FF
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

    case 'image/webp':
      // WEBP: bytes 0..3 = RIFF, bytes 8..11 = WEBP
      if (buf.length < 12) return false;
      return (
        buf[0] === 0x52 && // R
        buf[1] === 0x49 && // I
        buf[2] === 0x46 && // F
        buf[3] === 0x46 && // F
        buf[8] === 0x57 && // W
        buf[9] === 0x45 && // E
        buf[10] === 0x42 && // B
        buf[11] === 0x50 // P
      );

    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      // ICO: 00 00 01 00
      return (
        buf[0] === 0x00 &&
        buf[1] === 0x00 &&
        buf[2] === 0x01 &&
        buf[3] === 0x00
      );

    default:
      return false;
  }
}

/**
 * Threat 3 + 4: When a server returns `application/octet-stream` (common for
 * Azure Blob Storage blobs whose Content-Type was not explicitly set at upload
 * time), the declared MIME type carries no useful information. We resolve the
 * real type by inspecting magic bytes alone and accept only known-good image
 * signatures. This is at least as strict as the normal path — it never accepts
 * SVG and rejects anything whose bytes do not match a known image format.
 *
 * @param {Buffer} buf
 * @returns {string} resolved MIME type ('image/png', 'image/jpeg', etc.)
 * @throws {AssetFetchError} if no known image signature matches
 */
function resolveOctetStream(buf) {
  if (buf.length >= 4) {
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return 'image/png';
    }
    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return 'image/jpeg';
    }
    // ICO
    if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
      return 'image/x-icon';
    }
    // WEBP (needs 12 bytes)
    if (
      buf.length >= 12 &&
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) {
      return 'image/webp';
    }
  }
  throw new AssetFetchError(
    'application/octet-stream response did not match any known image magic bytes (PNG/JPEG/WEBP/ICO)',
    'MAGIC_BYTES_MISMATCH',
  );
}

/**
 * Parse and normalise a Content-Type header value.
 * e.g. "image/png; charset=utf-8" → "image/png"
 * @param {string | undefined} raw
 * @returns {string}
 */
function parseContentType(raw) {
  if (!raw) return '';
  return raw.split(';')[0].trim().toLowerCase();
}

/**
 * Low-level HTTPS GET with redirect following.
 * Threat 8: Fixed User-Agent and Accept headers; no cookie jar.
 *
 * @param {string} urlString
 * @param {number} maxBytes
 * @param {number} redirectsLeft
 * @returns {Promise<{ contentType: string; chunks: Buffer[] }>}
 */
function httpsGet(urlString, maxBytes, redirectsLeft) {
  return new Promise((resolve, reject) => {
    // Threat 1 + 2: Validate URL scheme and host on every hop (covers redirects).
    let parsedUrl;
    try {
      parsedUrl = new URL(urlString);
    } catch {
      return reject(new AssetFetchError(`invalid URL: ${urlString}`, 'INVALID_URL'));
    }

    // Threat 2: HTTPS only.
    if (parsedUrl.protocol !== 'https:') {
      return reject(
        new AssetFetchError(
          `scheme not allowed (only https): ${parsedUrl.protocol}`,
          'SCHEME_NOT_HTTPS',
        ),
      );
    }

    // Threat 1: Host allowlist.
    if (!isHostAllowed(parsedUrl.hostname)) {
      return reject(
        new AssetFetchError(
          `host not in allowlist: ${parsedUrl.hostname}`,
          'HOST_NOT_ALLOWED',
        ),
      );
    }

    // Threat 8: Fixed headers; no cookies.
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'emi-asset-fetcher/1.0 (+code-challenge)',
        Accept: 'image/*',
      },
    };

    const req = https.request(options, (res) => {
      const { statusCode } = res;

      // Threat 6: Handle redirects — revalidate Location.
      if (statusCode >= 300 && statusCode < 400) {
        const location = res.headers['location'];
        // Consume response body so socket is released.
        res.resume();
        if (!location) {
          return reject(
            new AssetFetchError('redirect with no Location header', 'NETWORK_ERROR'),
          );
        }
        if (redirectsLeft <= 0) {
          return reject(
            new AssetFetchError('too many redirects (max 3)', 'TOO_MANY_REDIRECTS'),
          );
        }
        // Resolve relative redirects against current URL.
        const nextUrl = new URL(location, urlString).toString();
        return resolve(httpsGet(nextUrl, maxBytes, redirectsLeft - 1));
      }

      if (statusCode !== 200) {
        res.resume();
        return reject(
          new AssetFetchError(`unexpected HTTP status: ${statusCode}`, 'NETWORK_ERROR'),
        );
      }

      // Threat 3: Content-Type validation.
      const contentType = parseContentType(res.headers['content-type']);

      // Explicitly reject SVG before the general allowlist check.
      if (contentType === 'image/svg+xml' || contentType.includes('svg')) {
        res.resume();
        return reject(
          new AssetFetchError(
            `content-type rejected (svg not allowed): ${contentType}`,
            'CONTENT_TYPE_REJECTED',
          ),
        );
      }

      // `application/octet-stream` is allowed to pass through here; it is
      // resolved to a concrete image MIME type via magic-byte sniffing in
      // fetchAsset() after the body is fully accumulated. This handles CDNs
      // (e.g. Azure Blob Storage) that serve images without a declared MIME type.
      const isOctetStream = contentType === 'application/octet-stream';

      if (!isOctetStream && !ALLOWED_CONTENT_TYPES.has(contentType)) {
        res.resume();
        return reject(
          new AssetFetchError(
            `content-type not in allowlist: ${contentType}`,
            'CONTENT_TYPE_REJECTED',
          ),
        );
      }

      // Threat 5: Content-Length pre-check.
      const clHeader = res.headers['content-length'];
      if (clHeader) {
        const cl = parseInt(clHeader, 10);
        if (!Number.isNaN(cl) && cl > maxBytes) {
          res.resume();
          return reject(
            new AssetFetchError(
              `Content-Length ${cl} exceeds max allowed bytes ${maxBytes}`,
              'SIZE_EXCEEDED',
            ),
          );
        }
      }

      // Stream accumulation with live size guard.
      const chunks = [];
      let accumulated = 0;

      res.on('data', (chunk) => {
        accumulated += chunk.length;
        // Threat 5: Abort if accumulation exceeds limit.
        if (accumulated > maxBytes) {
          req.destroy();
          reject(
            new AssetFetchError(
              `response body exceeded max allowed bytes ${maxBytes}`,
              'SIZE_EXCEEDED',
            ),
          );
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        resolve({ contentType, chunks });
      });

      res.on('error', (err) => {
        reject(new AssetFetchError(`stream error: ${err.message}`, 'NETWORK_ERROR'));
      });
    });

    req.on('error', (err) => {
      reject(new AssetFetchError(`request error: ${err.message}`, 'NETWORK_ERROR'));
    });

    req.end();
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Download a brand asset from an allowlisted URL into public/brand/.
 *
 * @param {{ url: string, destPath: string, maxBytes?: number }} options
 * @returns {Promise<{ absPath: string, bytes: number, sha256: string }>}
 * @throws {AssetFetchError}
 */
export async function fetchAsset({ url, destPath, maxBytes = DEFAULT_MAX_BYTES }) {
  // Threat 7: Sanitize destination before making any network call.
  const absPath = sanitizeDest(destPath);

  // Ensure public/brand/ exists.
  await fs.mkdir(BRAND_DIR, { recursive: true });

  // Perform the download (redirects handled internally, revalidated each hop).
  const { contentType, chunks } = await httpsGet(url, maxBytes, MAX_REDIRECTS);

  const body = Buffer.concat(chunks);

  // Threat 4: Magic-byte validation.
  // If the server returned application/octet-stream, resolve the real MIME type
  // from magic bytes (throws MAGIC_BYTES_MISMATCH if no known signature matches).
  // Otherwise, verify that the bytes match the declared content-type.
  const resolvedContentType =
    contentType === 'application/octet-stream'
      ? resolveOctetStream(body)
      : contentType;

  if (resolvedContentType !== contentType && !checkMagicBytes(body, resolvedContentType)) {
    throw new AssetFetchError(
      `magic bytes do not match resolved content-type: ${resolvedContentType}`,
      'MAGIC_BYTES_MISMATCH',
    );
  }

  if (resolvedContentType === contentType && !checkMagicBytes(body, contentType)) {
    throw new AssetFetchError(
      `magic bytes do not match declared content-type: ${contentType}`,
      'MAGIC_BYTES_MISMATCH',
    );
  }

  // Threat 9: Write-only. Never eval, new Function, or dynamic import of content.
  await fs.writeFile(absPath, body);

  // Compute SHA-256 of the written content.
  const sha256 = crypto.createHash('sha256').update(body).digest('hex');

  return { absPath, bytes: body.length, sha256 };
}

// ---------------------------------------------------------------------------
// CLI wrapper
// ---------------------------------------------------------------------------

/**
 * CLI: node fetch-asset.mjs <url> <dest>
 * Success → stdout: "OK <absPath> <bytes> sha256:<hex>"  exit 0
 * Failure → stderr: "REJECT <reason>"                    exit 1
 */
async function main() {
  const [, , urlArg, destArg] = process.argv;

  if (!urlArg || !destArg) {
    process.stderr.write(
      'REJECT usage: node fetch-asset.mjs <url> <dest-relative-or-absolute>\n',
    );
    process.exit(1);
  }

  try {
    const { absPath, bytes, sha256 } = await fetchAsset({
      url: urlArg,
      destPath: destArg,
    });
    process.stdout.write(`OK ${absPath} ${bytes} sha256:${sha256}\n`);
    process.exit(0);
  } catch (err) {
    const reason = err instanceof AssetFetchError ? err.message : String(err);
    process.stderr.write(`REJECT ${reason}\n`);
    process.exit(1);
  }
}

// Only run CLI when invoked directly (not when imported as a module).
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main();
}
