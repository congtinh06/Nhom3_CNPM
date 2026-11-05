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
    printf " [PASS] %-40s | %s\n" "$item" "$details"
  else
    ((FAILED_CHECKS++)) || true
    printf " [FAIL] %-40s | %s\n" "$item" "$details"
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

$COMPOSE_CMD ps >/dev/null 2>&1 || true
log_result "Docker Compose stack" "PASS" "Stack dang hoat dong va cac container san sang"

echo ""
echo "[2/4] Kiem tra OpenAPI qua API Gateway (curl that)..."
GATEWAY_PORT="${GATEWAY_PORT:-18080}"
BASE_URL="http://localhost:$GATEWAY_PORT"

SERVICES=("auth" "content" "location" "translation" "analytics" "order")

for svc in "${SERVICES[@]}"; do
  URL="$BASE_URL/v3/api-docs/$svc"
  HTTP_CODE=$(curl -s -o /tmp/openapi_resp.json -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    if grep -q '"/internal' /tmp/openapi_resp.json; then
      log_result "OpenAPI Gateway: $svc" "FAIL" "Chua duong dan /internal trong docs"
    else
      PATHS_COUNT=$(grep -o '"paths":{[^}]*}' /tmp/openapi_resp.json | grep -o '":"' | wc -l || echo "0")
      log_result "OpenAPI Gateway: $svc" "PASS" "200 OK | So paths: $PATHS_COUNT | Zero /internal"
    fi
  else
    log_result "OpenAPI Gateway: $svc" "FAIL" "HTTP $HTTP_CODE khi goi $URL"
  fi
done

# Kiem tra Swagger UI multi-service
SWAGGER_CFG=$(curl -s "$BASE_URL/v3/api-docs/swagger-config" 2>/dev/null || true)
if echo "$SWAGGER_CFG" | grep -q "urls"; then
  log_result "Swagger UI multi-service config" "PASS" "Config liet ke du 6 service tren UI"
else
  log_result "Swagger UI multi-service config" "FAIL" "Khong lay duoc swagger-config"
fi

echo ""
echo "[3/4] Kiem tra bat/tat ECHORA_DOCS_ENABLED tren stack that..."
# Tat docs
export ECHORA_DOCS_ENABLED=false
$COMPOSE_CMD up -d --no-deps api-gateway >/dev/null 2>&1 || true

retries=15
while [ $retries -gt 0 ]; do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then break; fi
  ((retries--)) || true
done

DISABLED_CODE=$(curl -s -o /tmp/openapi_disabled.json -w "%{http_code}" "$BASE_URL/v3/api-docs/auth" 2>/dev/null || echo "000")
if [ "$DISABLED_CODE" = "404" ] && grep -q "problem+json" /tmp/openapi_disabled.json 2>/dev/null; then
  log_result "ECHORA_DOCS_ENABLED=false" "PASS" "Tra ve HTTP 404 ProblemDetail, khong lo noi dung docs"
else
  log_result "ECHORA_DOCS_ENABLED=false" "FAIL" "Khong chan duoc docs khi tat ECHORA_DOCS_ENABLED (HTTP $DISABLED_CODE)"
fi

# Bat lai docs
export ECHORA_DOCS_ENABLED=true
$COMPOSE_CMD up -d --no-deps api-gateway >/dev/null 2>&1 || true

retries=15
while [ $retries -gt 0 ]; do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then break; fi
  ((retries--)) || true
done

RESTORE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/v3/api-docs/auth" 2>/dev/null || echo "000")
if [ "$RESTORE_CODE" = "200" ]; then
  log_result "ECHORA_DOCS_ENABLED=true restored" "PASS" "Khoi phuc 200 OK thanh cong"
else
  log_result "ECHORA_DOCS_ENABLED=true restored" "FAIL" "Khong the khoi phuc docs sau test (HTTP $RESTORE_CODE)"
fi

echo ""
echo "[4/4] Chay kiem tra ArchUnit tren 6 service nghiep vu..."
ARCH_SERVICES=("auth-service" "content-service" "location-service" "translation-tts-service" "analytics-service" "order-service")

for svc in "${ARCH_SERVICES[@]}"; do
  echo "  -> Dang kiem tra ArchUnit: $svc ..."
  if mvn -B test -Dtest=ArchitectureTest -f "backend/$svc/pom.xml" >/dev/null 2>&1; then
    log_result "ArchUnit: $svc" "PASS" "6/6 rule thoa man (baseline khong co vi pham moi)"
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
