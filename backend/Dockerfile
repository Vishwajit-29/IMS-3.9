FROM maven:3.9.8-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml for dependency resolution
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Package the application
RUN mvn package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the jar file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Set up environment variables with default values
ENV SPRING_DATA_MONGODB_HOST=mongodb \
    SPRING_DATA_MONGODB_PORT=27017 \
    SPRING_DATA_MONGODB_DATABASE=ims_db_1 \
    ALLOWED_ORIGINS=https://www.knoxcloud.tech,http://www.knoxcloud.tech,http://localhost:3000,http://frontend:3000

# Run the application
CMD ["java", "-jar", "app.jar"]
