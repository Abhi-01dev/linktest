# Multi-stage build for LinkTest Spring Boot Java Backend
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy maven wrapper and pom.xml
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy sources and package
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S linktest && adduser -S linktest -G linktest
USER linktest

COPY --from=build /app/target/linktest-backend-1.0.0.jar app.jar

ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
