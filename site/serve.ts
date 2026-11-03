// Production server for the published site — the team's single public surface.
//
// It serves three things on port 3000, in this order:
//
//   1. /api/*        → proxied to the FastAPI backend on 127.0.0.1:8000 with the
//                      /api prefix stripped, so the product SPA's existing API
//                      client (which prefixes every call with /api) works
//                      unchanged, same-origin, no CORS.
//   2. /webhooks/*   → proxied to the backend as-is, so Gumroad (and Viktor) can
//                      deliver webhooks to the public URL. The backend routes are
//                      /webhooks/gumroad and /webhooks/viktor.
//   3. everything else:
//        a. a real file in the TanStack Start build (dist/client) — SSR assets,
//        b. a real file in the product SPA build (../frontend/dist) — app JS/CSS,
//        c. an app deep link (/login, /dashboard, /deals, …) → the SPA shell, so
//           client-side routing handles it instead of 404ing,
//        d. otherwise the TanStack Start SSR handler — the marketing pages
//           (/ and /pricing) are rendered server-side, so they have real HTML.
//
// Both build outputs are produced by `bun run build` (vite build + the frontend
// app build), which `bun run publish` runs, so a plain restart of this server —
// or a fresh clone — serves the same thing. Run `bun run build` before starting.
//
// Starting a new instance supersedes the old one: it frees the port no matter
// which user owns the current server (provisioning starts it as `engine`; a team
// member's `bun run publish` runs as their own user), so publish never collides
// with an already-running server. Every sandbox user has passwordless sudo, so
// the takeover works across user boundaries.
import { resolve, sep } from "node:path";

import handler from "./dist/server/server.js";

// Pinned, NOT read from the environment. The published preview URL
// (<label>.<PUBLIC_SITE_DOMAIN>) is reverse-proxied to 0.0.0.0:3000 inside the
// sandbox, so the default site MUST bind there. Bun auto-loads .env files, so
// honouring process.env.PORT/HOST would let a stray env var or a .env in the site
// dir silently move the site off :3000 (or onto loopback) and break the public URL.
const PORT = 3000;
const HOST = "0.0.0.0";
const SITE_DIR = import.meta.dir;
const CLIENT_DIR = `${SITE_DIR}/dist/client`;
// The product SPA (React Router) build. Kept in its own repo directory; served
// here rather than from a second server so port 3000 stays the only surface.
const APP_DIR = resolve(SITE_DIR, "../frontend/dist");
const BACKEND = "http://127.0.0.1:8000";

// Top-level URL segments owned by the SPA's client-side router. A request for
// one of these (a bookmark, a refresh, a link from an email) must return the SPA
// shell with a 200 rather than falling through to the marketing 404.
const APP_ROUTES = new Set([
  "login",
  "dashboard",
  "deals",
  "contacts",
  "properties",
  "tasks",
  "portfolios",
  "nurture",
]);

// Headers that describe the connection to the backend, not the payload, plus the
// ones fetch has already undone (Bun decodes the body, so content-encoding and
// content-length from the origin would be wrong to pass on).
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
  "host",
]);

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_CACHE = "no-cache";

function resolveIn(base: string, pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const root = resolve(base);
  const full = resolve(root + decoded);
  // Reject anything that escapes the served directory (path traversal).
  if (full !== root && !full.startsWith(root + sep)) return null;
  return full;
}

function cacheFor(pathname: string): string {
  // Vite emits content-hashed files under /assets; those can be cached forever.
  return pathname.startsWith("/assets/") ? IMMUTABLE : NO_CACHE;
}

async function fileResponse(path: string, pathname: string): Promise<Response> {
  const file = Bun.file(path);
  return new Response(file, {
    headers: {
      "content-type": file.type || "application/octet-stream",
      "cache-control": cacheFor(pathname),
    },
  });
}

async function proxy(req: Request, targetPath: string): Promise<Response> {
  const headers = new Headers(req.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Webhook and API bodies are small (form-encoded or JSON), so buffering is
    // simpler and safer than streaming through a duplex request.
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(BACKEND + targetPath, init);
  } catch (err) {
    return Response.json(
      { detail: `Backend unreachable: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  for (const [key, value] of upstream.headers) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    outHeaders.set(key, value);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

// Take over the port, re-freeing and retrying if another publish grabbed it in the
// gap between freeing and binding (last publish wins). Bun.serve throws EADDRINUSE
// synchronously, so without this a raced publish would die while the shell already
// reported success.
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname, search } = new URL(req.url);

        // 1. API proxy — strip the /api prefix the SPA's client adds.
        if (pathname === "/api" || pathname.startsWith("/api/")) {
          const rest = pathname.slice("/api".length) || "/";
          return proxy(req, rest + search);
        }

        // 2. Webhooks — same path as the backend route, no rewriting.
        if (pathname.startsWith("/webhooks/")) {
          return proxy(req, pathname + search);
        }

        if (req.method === "GET" || req.method === "HEAD") {
          // 3a. Files from the site build (marketing SSR assets, favicon).
          const siteFile = resolveIn(CLIENT_DIR, pathname);
          if (siteFile && (await Bun.file(siteFile).exists())) {
            return fileResponse(siteFile, pathname);
          }

          // 3b. Files from the SPA build (hashed app JS/CSS, favicon).
          const appFile = resolveIn(APP_DIR, pathname);
          if (appFile && (await Bun.file(appFile).exists())) {
            return fileResponse(appFile, pathname);
          }

          // 3c. App deep links → SPA shell, client-side router takes it from there.
          const segment = pathname.split("/")[1] ?? "";
          if (APP_ROUTES.has(segment)) {
            const shell = Bun.file(`${APP_DIR}/index.html`);
            if (await shell.exists()) {
              return new Response(shell, {
                headers: { "content-type": "text/html; charset=utf-8", "cache-control": NO_CACHE },
              });
            }
          }
        }

        // 3d. Marketing pages, server-rendered.
        return (handler as { fetch: (r: Request) => Response | Promise<Response> }).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);
console.log(`  site build:  ${CLIENT_DIR}`);
console.log(`  app build:   ${APP_DIR}`);
console.log(`  api backend: ${BACKEND}`);
