#!/usr/bin/env bash
set -euo pipefail

code_quality() {
  echo "Checking formatting..."
  deno fmt --check
  echo "Linting..."
  deno lint
}

update_cache() {
  deno cache --lock=lock.json ./src/mod.ts
}

update_lock() {
  deno cache --reload ./src/mod.ts
  deno cache ./src/mod.ts --lock ./lock.json --lock-write
}

"$@"