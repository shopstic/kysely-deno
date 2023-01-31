#!/usr/bin/env bash
set -euo pipefail

code_quality() {
  echo "Checking formatting..."
  deno fmt --check
  echo "Linting..."
  deno lint
}

update_cache() {
  deno cache --lock=deno.lock ./src/mod.ts
}

update_lock() {
  deno cache --reload ./src/mod.ts
  deno cache ./src/mod.ts --lock ./deno.lock --lock-write
}

"$@"