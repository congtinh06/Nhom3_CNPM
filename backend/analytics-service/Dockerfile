# Multi-stage Dockerfile cho analytics-service (Java 17)
# Stage 1: Build JAR
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# Stage 2: Minimal Runtime (chay bang user khong phai root)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Tao group/user rieng (uid/gid 10001) va thu muc tam ghi duoc cho JVM
RUN addgroup -S -g 10001 app \
    && adduser -S -u 10001 -G app app \
    && mkdir -p /app/tmp \
    && chown -R app:app /app/tmp

COPY --from=build --chown=app:app /app/target/*.jar app.jar

ENV TMPDIR=/app/tmp
USER 10001:10001
EXPOSE 8081

# Healthcheck goi actuator/health (wget co san trong busybox cua image alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=5 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8081/actuator/health || exit 1

ENTRYPOINT ["java", "-Djava.io.tmpdir=/app/tmp", "-jar", "app.jar"]
