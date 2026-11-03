# Multi-stage Dockerfile cho translation-tts-service (Java 17 + edge-tts)
# Stage 1: Build JAR
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# Stage 2: Runtime (chay bang user khong phai root)
FROM eclipse-temurin:17-jre-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir edge-tts==7.3.1

WORKDIR /app

# Tao group/user rieng (uid/gid 10001). Cac thu muc can ghi:
#  - /app/storage/audio: volume audio-storage-data (file mp3)
#  - /app/tmp + /app/.cache: thu muc tam / cache cho JVM va edge-tts
RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --home-dir /app --no-create-home --shell /usr/sbin/nologin app \
    && mkdir -p /app/storage/audio /app/tmp /app/.cache \
    && chown -R app:app /app/storage/audio /app/tmp /app/.cache

VOLUME ["/app/storage/audio"]

COPY --from=build --chown=app:app /app/target/*.jar app.jar

ENV TMPDIR=/app/tmp \
    HOME=/app \
    XDG_CACHE_HOME=/app/.cache
USER 10001:10001
EXPOSE 8083

# Healthcheck goi actuator/health (wget da cai o tren)
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8083/actuator/health || exit 1

ENTRYPOINT ["java", "-Djava.io.tmpdir=/app/tmp", "-jar", "app.jar"]
