#!/usr/bin/env bash
# Submit the public pages to IndexNow.
#
# IndexNow is the free, account-less ping protocol that Bing, Yandex, Seznam and
# Naver share: one POST tells all of them "these URLs changed, come and look".
# There is no key to register and no dashboard — the only proof of ownership is a
# text file at the site root whose NAME is the key and whose CONTENT is the key.
# Ours lives at site/public/<key>.txt, so Vite copies it to dist/client and the
# production server serves it at https://<host>/<key>.txt.
#
# Usage:
#   ./scripts/submit-indexnow.sh                 # submit the sitemap's URLs
#   ./scripts/submit-indexnow.sh https://…/x     # submit specific URLs
#
# Expected result: HTTP 200 or 202 ("accepted"). 403 means the key file is not
# publicly fetchable at the expected path; 422 means the key or URL list is wrong.
set -euo pipefail

SITE_URL="${SITE_URL:-https://b1030a08ef30e5884826c2e6eaf3d383.cto.site}"
HOST="${SITE_URL#https://}"
SITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# The key is the filename of the one 32-hex-character .txt in public/.
KEY_FILE="$(find "$SITE_DIR/public" -maxdepth 1 -type f -name '*.txt' | grep -E '/[0-9a-f]{32}\.txt$' | head -1 || true)"
if [ -z "$KEY_FILE" ]; then
  echo "error: no IndexNow key file found in $SITE_DIR/public (expected <32 hex chars>.txt)" >&2
  exit 1
fi
KEY="$(basename "$KEY_FILE" .txt)"
KEY_LOCATION="${SITE_URL}/${KEY}.txt"

if [ "$#" -gt 0 ]; then
  URLS=("$@")
else
  URLS=(
    "${SITE_URL}/"
    "${SITE_URL}/pricing"
    "${SITE_URL}/tools/arv-calculator"
    "${SITE_URL}/tools/cash-flow-calculator"
  )
fi

# Build the JSON body with python3 so the URL list is escaped correctly.
PAYLOAD="$(python3 -c '
import json, sys
host, key, key_location = sys.argv[1], sys.argv[2], sys.argv[3]
urls = sys.argv[4:]
print(json.dumps({"host": host, "key": key, "keyLocation": key_location, "urlList": urls}))
' "$HOST" "$KEY" "$KEY_LOCATION" "${URLS[@]}")"

echo "host:         $HOST"
echo "keyLocation:  $KEY_LOCATION"
echo "urls:         ${#URLS[@]}"
printf 'payload:      %s\n\n' "$PAYLOAD"

STATUS="$(curl -sS -o /tmp/indexnow-response.txt -w '%{http_code}' \
  -X POST "https://api.indexnow.org/indexnow" \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data "$PAYLOAD")"

echo "HTTP status:  $STATUS"
if [ -s /tmp/indexnow-response.txt ]; then
  echo "response body:"
  cat /tmp/indexnow-response.txt
  echo
fi

case "$STATUS" in
  200|202) echo "OK — URLs submitted." ;;
  400) echo "Bad request — the JSON body was malformed." >&2 ;;
  403) echo "Forbidden — the key file is not fetchable at $KEY_LOCATION." >&2 ;;
  422) echo "Unprocessable — the key does not match the key file, or a URL host differs." >&2 ;;
  429) echo "Rate limited — try again later." >&2 ;;
  *) echo "Unexpected status $STATUS." >&2 ;;
esac
