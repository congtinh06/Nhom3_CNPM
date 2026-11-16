#!/usr/bin/env bash
# deploy-local.sh - pull a GHCR image tag and restart this machine's Compose stack.
#
# Usage:
#   IMAGE_TAG=sha-abc1234 DEPLOY_DIR=/f/Nhom3_CNPM bash scripts/deploy/deploy-local.sh
#   bash scripts/deploy/deploy-local.sh --dry-run
#
# Health check polls the local API gateway, never the public URL:
#   http://127.0.0.1:18080/actuator/health
# Override it with LOCAL_HEALTH_URL if the gateway is published on another port.
#
# The script reads DEPLOY_DIR/.env. It never creates or edits that file.
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,11p' "$0"
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$arg" >&2
      exit 2
      ;;
  esac
done

to_posix_path() {
  local p="$1"
  if [[ "$p" =~ ^[A-Za-z]:[\\/] ]]; then
    local drive="${p:0:1}"
    local rest="${p:2}"
    rest="${rest//\\//}"
    printf '/%s%s\n' "$(printf '%s' "$drive" | tr '[:upper:]' '[:lower:]')" "$rest"
  else
    printf '%s\n' "$p"
  fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="$(to_posix_path "${DEPLOY_DIR:-$REPO_ROOT}")"
IMAGE_TAG="${IMAGE_TAG:-}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:18080/actuator/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-36}"
HEALTH_INTERVAL_SECONDS="${HEALTH_INTERVAL_SECONDS:-5}"
TAG_FILE="$DEPLOY_DIR/.deployed-image-tag"

COMPOSE_FILES=(
  -f "$DEPLOY_DIR/docker-compose.yml"
  -f "$DEPLOY_DIR/docker-compose.deploy.yml"
)

log() { printf '[deploy-local] %s\n' "$*"; }
die() { printf '[deploy-local] ERROR: %s\n' "$*" >&2; exit 1; }

[ -n "$IMAGE_TAG" ] || die "IMAGE_TAG is required (example: sha-07275db)"
[ -d "$DEPLOY_DIR" ] || die "DEPLOY_DIR does not exist: $DEPLOY_DIR"
[ -f "$DEPLOY_DIR/.env" ] || die "Missing $DEPLOY_DIR/.env; this script never creates it"
[ -f "$DEPLOY_DIR/docker-compose.yml" ] || die "Missing $DEPLOY_DIR/docker-compose.yml"
[ -f "$DEPLOY_DIR/docker-compose.deploy.yml" ] || die "Missing $DEPLOY_DIR/docker-compose.deploy.yml"
command -v docker >/dev/null 2>&1 || die "docker is not on PATH"

REQUIRED_KEYS=(
  MSSQL_SA_PASSWORD
  CONTENT_DB_PASSWORD
  TRANSLATION_DB_PASSWORD
  ANALYTICS_DB_PASSWORD
  AUTH_DB_PASSWORD
  ORDER_DB_PASSWORD
  RABBITMQ_DEFAULT_USER
  RABBITMQ_DEFAULT_PASS
  RABBITMQ_ERLANG_COOKIE
  INTERNAL_API_KEY
  JWT_SECRET
)

missing=()
for key in "${REQUIRED_KEYS[@]}"; do
  value="$(grep -E "^${key}=" "$DEPLOY_DIR/.env" | tail -n 1 | cut -d= -f2- || true)"
  value="${value%$'\r'}"
  if [ -z "${value//[[:space:]]/}" ]; then
    missing+=("$key")
  fi
done
if [ "${#missing[@]}" -gt 0 ]; then
  die "Missing required values in $DEPLOY_DIR/.env: ${missing[*]}"
fi

compose() {
  local tag="$1"
  shift
  if [ "$DRY_RUN" = "1" ]; then
    printf '[dry-run] (cd %s && IMAGE_TAG=%s docker compose --project-directory %s --env-file %s %s %s)\n' \
      "$DEPLOY_DIR" "$tag" "$DEPLOY_DIR" "$DEPLOY_DIR/.env" "${COMPOSE_FILES[*]}" "$*"
    return 0
  fi
  (
    cd "$DEPLOY_DIR"
    IMAGE_TAG="$tag" docker compose \
      --project-directory "$DEPLOY_DIR" \
      --env-file "$DEPLOY_DIR/.env" \
      "${COMPOSE_FILES[@]}" "$@"
  )
}

deploy_tag() {
  local tag="$1"
  local pull_retries=3
  local pull_ok=0
  for ((attempt = 1; attempt <= pull_retries; attempt++)); do
    log "Pulling image tag=$tag (attempt $attempt/$pull_retries)"
    if compose "$tag" pull; then
      pull_ok=1
      break
    fi
    log "Pull attempt $attempt failed; waiting 5s before retrying..."
    sleep 5
  done
  [ "$pull_ok" -eq 1 ] || return 1

  log "Recreating containers with tag=$tag"
  compose "$tag" up -d --no-build --remove-orphans || return 1
}

wait_healthy() {
  local attempt
  for ((attempt = 1; attempt <= HEALTH_RETRIES; attempt++)); do
    if curl -fsS --max-time 10 "$LOCAL_HEALTH_URL" >/dev/null 2>&1; then
      log "Health OK after ${attempt} attempt(s): $LOCAL_HEALTH_URL"
      return 0
    fi
    log "Health check ${attempt}/${HEALTH_RETRIES} failed; retrying in ${HEALTH_INTERVAL_SECONDS}s"
    sleep "$HEALTH_INTERVAL_SECONDS"
  done
  return 1
}

log "Deploying tag=${IMAGE_TAG} from ${DEPLOY_DIR}"

if [ "$DRY_RUN" = "1" ]; then
  deploy_tag "$IMAGE_TAG"
  log "[dry-run] would wait for ${LOCAL_HEALTH_URL}; no containers were changed"
  exit 0
fi

PREVIOUS_TAG="$(cat "$TAG_FILE" 2>/dev/null || true)"

deploy_ok=0
if deploy_tag "$IMAGE_TAG"; then
  if wait_healthy; then
    printf '%s\n' "$IMAGE_TAG" > "$TAG_FILE"
    log "Deploy successful; wrote ${TAG_FILE}"
    exit 0
  else
    log "Health check failed for tag=${IMAGE_TAG}" >&2
  fi
else
  log "Deployment failed during image pull or container recreation for tag=${IMAGE_TAG}" >&2
fi

if [ -n "$PREVIOUS_TAG" ] && [ "$PREVIOUS_TAG" != "$IMAGE_TAG" ]; then
  log "Rolling back to tag=${PREVIOUS_TAG}" >&2
  if deploy_tag "$PREVIOUS_TAG" && wait_healthy; then
    log "Rollback healthy at tag=${PREVIOUS_TAG}" >&2
  else
    log "Rollback also failed; manual intervention required" >&2
  fi
else
  log "No previous tag to roll back to" >&2
fi

exit 1
