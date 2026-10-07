# Build stage
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY smarthome ./smarthome
RUN javac --release 17 -encoding UTF-8 -d out $(find smarthome -name '*.java') \
 && mkdir -p out/smarthome/web \
 && cp -R smarthome/web/static out/smarthome/web/static

# Run stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/out ./out
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "java -Dsmarthome.host=0.0.0.0 -cp out smarthome.web.SmartHomeServer"]
