# Multi-stage build para Spring Boot

# Stage 1: Build con Maven
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar archivos de configuración Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime con JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Instalar tzdata y certificados SSL para Gmail
RUN apk add --no-cache tzdata ca-certificates && \
    update-ca-certificates

# Configurar zona horaria de Ecuador/Colombia
ENV TZ=America/Guayaquil

# Copiar el JAR compilado desde el stage anterior
COPY --from=build /app/target/*.jar app.jar

# Crear directorio para la base de datos SQLite
RUN mkdir -p /app/data

# Exponer puerto
EXPOSE 8081

# Variables de entorno (serán sobrescritas por docker-compose)
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
