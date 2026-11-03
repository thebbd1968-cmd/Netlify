#!/usr/bin/env bash
# Build the product SPA (../frontend) into ../frontend/dist.
#
# serve.ts serves that directory as the application shell on port 3000, so the
# public site cannot go live without it. This runs as part of `bun run build`,
# which `bun run publish` invokes — which keeps the deploy reproducible from a
# clean clone instead of depending on an untracked dist/ folder.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_dir="$(cd "$here/../../frontend" && pwd)"

cd "$app_dir"

if [ ! -d node_modules ]; then
  echo "==> installing product app dependencies"
  npm ci --no-audit --no-fund
fi

echo "==> building product app (frontend)"
npm run build
