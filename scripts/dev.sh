#!/bin/bash
# Start the dev server with a clean environment
# This prevents shell environment variables from overriding .env.local

cd "$(dirname "$0")/.." || exit 1

# Clear environment and only keep essentials, then let Next.js load .env.local
exec env -i \
  HOME="$HOME" \
  PATH="$PATH" \
  TERM="${TERM:-xterm}" \
  SHELL="$SHELL" \
  npm run dev
