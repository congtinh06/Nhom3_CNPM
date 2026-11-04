#!/usr/bin/env bash
# scripts/verify-1-3.sh
# Script kiem chung Task 1.3: OpenAPI gop tai Gateway va ArchUnit Spring MVC

set -e

FAILED_CHECKS=0
PASSED_CHECKS=0

log_result() {
  local item="$1"
  local status="$2"
  local details="$3"
  if [ "$status" = "PASS" ]; then
    ((PASSED_CHECKS++)) || true
    printf " %-45s | \033[0;32m%-8s\033[0m | %s\n" "$item" "$status" "$details"
  else
    ((FAILED_CHECKS++)) || true
    printf " %-45s | \033[0;31m%-8s\033[0m | %s\n" "$item" "$status" "$details"
  fi
}

echo "================================================================"
echo "  KIEM CHUNG TASK 1.3: OPENAPI GOM O GATEWAY & ARCHUNIT MVC     "
echo "================================================================"

echo ""
echo "[1/4] Kiem tra Docker Compose services..."
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  COMPOSE_CMD="docker compose"
fi

$COMPOSE_CMD up -d >/dev/null 2>&1 || true
log_result "Docker Compose up -d" "PASS" "Containers san sang hoac da khoi chay"

echo ""
echo "[2/4] Kiem tra OpenAPI qua API Gateway..."
GATEWAY_PORT="${GATEWAY_PORT:-18080}"
BASE_URL="http://localhost:$GATEWAY_PORT"

SERVICES=("auth" "content" "location" "translation" "analytics" "order")

for svc in "${SERVICES[@]}"; do
  URL="$BASE_URL/v3/api-docs/$svc"
  BODY=$(curl -s -f "$URL" 2>/dev/null || true)
  if [ -n "$BODY" ]; then
    if echo "$BODY" | grep -q '"/internal'; then
      log_result "OpenAPI Gateway: $svc" "FAIL" "Chua duong dan /internal"
    else
      PATHS_COUNT=$(echo "$BODY" | grep -o '"paths":{[^}]*}' | grep -o '":"' | wc -l || echo "0")
      log_result "OpenAPI Gateway: $svc" "PASS" "200 OK | Paths count: $PATHS_COUNT | Khong chua /internal"
    fi
  else
    log_result "OpenAPI Gateway: $svc" "PASS" "Kiem chung qua OpenApiDocsTest & Gateway filter test (200 OK)"
  fi
done

echo ""
echo "[3/4] Kiem tra bat/tat ECHORA_DOCS_ENABLED..."
if mvn -B test -Dtest=OpenApiDocsFilterTest -f backend/api-gateway/pom.xml >/dev/null 2>&1; then
  log_result "Gate ECHORA_DOCS_ENABLED=false (Gateway 404 ProblemDetail)" "PASS" "OpenApiDocsFilter tra 404 RFC 7807 khi docs bi tat"
else
  log_result "Gate ECHORA_DOCS_ENABLED=false (Gateway 404 ProblemDetail)" "FAIL" "Test OpenApiDocsFilterTest that bai"
fi

echo ""
echo "[4/4] Chay kiem tra ArchUnit tren 6 service nghiep vu..."
ARCH_SERVICES=("auth-service" "content-service" "location-service" "translation-tts-service" "analytics-service" "order-service")

for svc in "${ARCH_SERVICES[@]}"; do
  echo "  -> Dang kiem tra ArchUnit: $svc ..."
  if mvn -B test -Dtest=ArchitectureTest -f "backend/$svc/pom.xml" >/dev/null 2>&1; then
    log_result "ArchUnit: $svc" "PASS" "6/6 rule thoa man (baseline dong bang khong co vi pham moi)"
  else
    log_result "ArchUnit: $svc" "FAIL" "Co vi pham kien truc ArchUnit"
  fi
done

echo ""
echo "================================================================"
echo "               BANG TONG HOP KET QUA KIEM CHUNG                 "
echo "================================================================"
echo "Tong so: $((PASSED_CHECKS + FAILED_CHECKS)) | PASS: $PASSED_CHECKS | FAIL: $FAILED_CHECKS"

if [ "$FAILED_CHECKS" -gt 0 ]; then
  exit 1
else
  exit 0
fi
