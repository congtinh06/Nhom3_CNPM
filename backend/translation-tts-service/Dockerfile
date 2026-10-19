FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

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
RUN mkdir -p /app/storage/audio
VOLUME ["/app/storage/audio"]

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
