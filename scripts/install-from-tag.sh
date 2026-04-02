#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-shuanbao0/codex-hud}"
TAG="${TAG:-}"
PRESET="${PRESET:-full}"

usage() {
  cat <<'EOF'
Install codex-hud from a Git tag.

Usage:
  bash scripts/install-from-tag.sh [--tag <tag>] [--preset <full|essential|minimal>] [--repo <owner/name>]

Environment variables:
  TAG       Optional. If unset, uses the latest tag.
  PRESET    Optional. Defaults to "full".
  REPO      Optional. Defaults to "shuanbao0/codex-hud".
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

resolve_latest_tag() {
  git ls-remote --refs --tags --sort='version:refname' "https://github.com/${REPO}.git" \
    | awk -F/ '{print $3}' \
    | tail -n 1
}

tag_exists() {
  git ls-remote --exit-code --refs --tags "https://github.com/${REPO}.git" "refs/tags/$1" >/dev/null 2>&1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      if [[ $# -lt 2 ]]; then
        echo "--tag requires a value." >&2
        exit 1
      fi
      TAG="$2"
      shift 2
      ;;
    --preset)
      if [[ $# -lt 2 ]]; then
        echo "--preset requires a value." >&2
        exit 1
      fi
      PRESET="$2"
      shift 2
      ;;
    --repo)
      if [[ $# -lt 2 ]]; then
        echo "--repo requires a value." >&2
        exit 1
      fi
      REPO="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "$PRESET" in
  full|essential|minimal) ;;
  *)
    echo "Invalid preset: $PRESET (expected: full|essential|minimal)" >&2
    exit 1
    ;;
esac

require_cmd git
require_cmd node
require_cmd npm

if [[ -z "$TAG" ]]; then
  TAG="$(resolve_latest_tag)"
fi

if [[ -z "$TAG" ]]; then
  echo "Could not resolve latest tag for ${REPO}." >&2
  exit 1
fi

if ! tag_exists "$TAG"; then
  echo "Tag not found: ${REPO}@${TAG}" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

echo "Installing ${REPO}@${TAG} with preset=${PRESET} ..."
git clone --depth 1 --branch "$TAG" "https://github.com/${REPO}.git" "$tmp_dir/repo"

cd "$tmp_dir/repo"
npm ci

if [[ -f scripts/install-local-oneclick.mjs ]]; then
  npm run install:local:oneclick -- --preset "$PRESET"
else
  npm run build
  npm run install:local
  plugin_dir="${HOME}/.codex/plugins/codex-hud"
  cd "$plugin_dir"
  npm ci
  npm run build
  node dist/index.js setup
  node dist/index.js configure --preset "$PRESET"
  node dist/index.js doctor
fi

echo "Install complete: ${REPO}@${TAG}"
