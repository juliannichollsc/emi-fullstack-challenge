---
name: asset-fetcher
description: Safely download brand assets (PNG/JPEG/WEBP/ICO) from an allowlisted host into public/brand/. Hardened against SSRF, XSS-via-SVG, content-type spoofing, path traversal, and oversize DoS. Use only when the project needs to vendor a remote image asset.
version: 1.0.0
---

# asset-fetcher

A hardened, zero-dependency Node.js ESM utility for vendoring brand assets from trusted hosts into `public/brand/`. Every validation step is mapped to a specific threat in the model below.

## When to use

- The project needs to download a logo, favicon, or other brand image from `grupoemi.com` into the repo.
- You want a reproducible, auditable way to vendor a remote asset without adding npm dependencies.
- Phase 2A of the EMI task-app branding work (logo + favicon download).

Do **not** use this skill to:
- Download arbitrary URLs (the allowlist is intentionally narrow).
- Download SVG files (rejected by design — SVG can carry `<script>` tags).
- Perform general-purpose HTTP work (use `httpClient.ts` for app runtime HTTP).

## Threat model

| # | Validation performed | Threat mitigated |
|---|---|---|
| 1 | Host allowlist: `EXACT_HOSTS` set (literal match — includes `grupoemi.com`, `www.grupoemi.com`, and `stpaginawebpdn.blob.core.windows.net`) plus `SUFFIX_HOSTS` list (subdomain suffix — `.grupoemi.com` only). Exact and suffix sets are kept separate to prevent wildcard creep (e.g., `*.blob.core.windows.net` is never permitted). | SSRF / internal host reachability / data exfiltration |
| 3b | `application/octet-stream` passthrough: Azure Blob Storage serves images without a declared MIME type. When `Content-Type: application/octet-stream` is received, `resolveOctetStream()` sniffs magic bytes and resolves a concrete image type before writing. SVG is still explicitly rejected upstream (before this path). Any body that does not match PNG/JPEG/WEBP/ICO magic is rejected with `MAGIC_BYTES_MISMATCH`. | Content-Type spoofing / untyped binary acceptance |
| 2 | Protocol must be `https:` — reject `http:`, `file:`, `data:`, `ftp:`, etc. | MITM / protocol downgrade |
| 3 | `Content-Type` allowlist: `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/x-icon`, `image/vnd.microsoft.icon`. Explicit rejection of `image/svg+xml`. | XSS via embedded SVG `<script>` |
| 4 | Magic-byte validation post-download: PNG `89 50 4E 47`, JPEG `FF D8 FF`, WEBP `RIFF????WEBP`, ICO `00 00 01 00`. | Content-Type spoofing (server lies about type) |
| 5 | Max size 2 MB default (configurable). `Content-Length` checked up-front; byte accumulation aborted mid-stream if exceeded. | DoS — disk/memory exhaustion |
| 6 | Redirects followed up to 3 hops; each `Location` header re-validated against the host allowlist and `https:` scheme before following. | Open redirect to malicious / internal host |
| 7 | Destination filename restricted to `/^[a-zA-Z0-9._-]+$/`; `path.resolve()` on dest; result asserted to start with `<repoRoot>/public/brand`. | Path traversal / directory escape |
| 8 | No cookie jar. Fixed `User-Agent: emi-asset-fetcher/1.0 (+code-challenge)`. Fixed `Accept: image/*`. | Session-token leakage / credential exfiltration |
| 9 | Downloaded bytes written only via `fs.writeFile`. No `eval`, `new Function()`, or dynamic `import()` of content. | Remote Code Execution (RCE) |

## Allowlist

The allowlist is split into two separate sets in `fetch-asset.mjs`:

**`EXACT_HOSTS`** — literal hostname match only; suffix-wildcard does **not** apply.

| Exact hostname | Justification |
|---|---|
| `grupoemi.com` | Brand domain |
| `www.grupoemi.com` | Brand domain (www) |
| `stpaginawebpdn.blob.core.windows.net` | CDN where Grupo EMI Falck's Next.js site (`grupoemi.com/colombia`) hosts brand assets. Added as a nominal exact-host exception — broad suffix-matching against `*.blob.core.windows.net` would open access to tens of millions of unrelated public Azure blobs and is therefore forbidden. |

**`SUFFIX_HOSTS`** — any subdomain whose hostname ends with the listed suffix.

| Suffix | Matches |
|---|---|
| `.grupoemi.com` | `https://cdn.grupoemi.com/…`, `https://assets.grupoemi.com/…` |

Any other host — including `localhost`, `127.0.0.1`, `169.254.x.x`, `10.x`, `192.168.x` — is rejected immediately.

## Usage

### CLI

```bash
node .claude/skills/asset-fetcher/scripts/fetch-asset.mjs <url> <dest>
```

- `<url>` — full `https://` URL of the asset.
- `<dest>` — filename relative to `public/brand/` **or** absolute path inside `public/brand/`.

Examples:

```bash
# Download logo to public/brand/logo.png
node .claude/skills/asset-fetcher/scripts/fetch-asset.mjs \
  "https://www.grupoemi.com/images/logo.png" \
  "logo.png"

# Download favicon
node .claude/skills/asset-fetcher/scripts/fetch-asset.mjs \
  "https://www.grupoemi.com/favicon.ico" \
  "favicon.ico"
```

**Success stdout:**
```
OK /absolute/path/to/public/brand/logo.png 12345 sha256:abc123…
```

**Failure stderr:**
```
REJECT host not in allowlist: example.com
```

### Node API (programmatic)

```js
import { fetchAsset, AssetFetchError } from
  '.claude/skills/asset-fetcher/scripts/fetch-asset.mjs';

try {
  const { absPath, bytes, sha256 } = await fetchAsset({
    url: 'https://www.grupoemi.com/images/logo.png',
    destPath: 'logo.png',          // relative to public/brand/ or absolute
    maxBytes: 2 * 1024 * 1024,     // optional, default 2 MB
  });
  console.log(`Saved ${bytes} bytes → ${absPath} (sha256: ${sha256})`);
} catch (err) {
  if (err instanceof AssetFetchError) {
    console.error('Rejected:', err.code, err.message);
  }
}
```

### Return value

```ts
interface FetchResult {
  absPath: string;   // absolute path to written file
  bytes:   number;   // bytes written
  sha256:  string;   // hex-encoded SHA-256 of file content (no prefix)
}
```

### `AssetFetchError`

```ts
class AssetFetchError extends Error {
  code: string;  // e.g. 'HOST_NOT_ALLOWED', 'SCHEME_NOT_HTTPS',
                 //      'CONTENT_TYPE_REJECTED', 'MAGIC_BYTES_MISMATCH',
                 //      'SIZE_EXCEEDED', 'TOO_MANY_REDIRECTS',
                 //      'PATH_TRAVERSAL', 'NETWORK_ERROR'
}
```

## Self-test

```bash
node .claude/skills/asset-fetcher/scripts/self-test.mjs
```

### Test cases

| Case | Description | Expected |
|---|---|---|
| A | Happy path — real PNG/JPEG from `www.grupoemi.com` | `OK …` printed; file written; PASS (SKIPPED if site has no static images) |
| B | SVG URL — either found on site or constructed | `REJECT` with reason mentioning `svg` or `content-type` |
| C | Disallowed host — `https://example.com/logo.png` | `REJECT` with reason mentioning `host` |
| D | Oversize — Case A URL with `maxBytes: 100` | `REJECT` with reason mentioning `size` or `bytes` |

Exit `0` if all cases PASS (Case A SKIPPED counts as PASS). Exit `1` on any unexpected failure.

## Output contract

### stdout (success)

```
OK <absPath> <byteCount> sha256:<hex64>
```

### stderr (failure)

```
REJECT <human-readable reason>
```

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Asset written successfully |
| `1` | Any validation or network failure |
