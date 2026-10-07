package smarthome.web;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executors;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/**
 * Web front end for the smart home. Uses only the JDK's built-in HTTP server.
 *
 * Run:  java -cp out smarthome.web.SmartHomeServer [port]
 * Then open http://localhost:8080
 *
 * The console app (smarthome.SmartHomeController) is unchanged and still works on its own.
 *
 * REST API
 *   GET  /api/health
 *   GET  /api/home                        rooms, devices, routines
 *   GET  /api/devices                     all devices
 *   GET  /api/devices/{id}                one device
 *   POST /api/devices/{id}/commands       {"action": "turnOn", "value": ...}
 *   POST /api/routines/{id}/run
 *   GET  /api/activity                    recent commands and device messages
 *   POST /api/dev/devices/{id}/availability {"available": false}
 *        (only with -Dsmarthome.devtools=true; simulates an unresponsive device)
 */
public class SmartHomeServer {

    private final HttpServer server;
    private final DeviceRegistry registry;
    private final boolean devtools;
    private final Path staticDir;

    public SmartHomeServer(String host, int port, DeviceRegistry registry, boolean devtools) throws IOException {
        this.registry = registry;
        this.devtools = devtools;
        this.staticDir = findStaticDir();
        this.server = HttpServer.create(new InetSocketAddress(host, port), 0);
        this.server.createContext("/", this::handle);
        this.server.setExecutor(Executors.newFixedThreadPool(4));
    }

    public void start() {
        server.start();
    }

    public void stop() {
        server.stop(0);
    }

    public int getPort() {
        return server.getAddress().getPort();
    }

    public static void main(String[] args) throws IOException {
        int port = 8080;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        } else if (System.getenv("PORT") != null) {
            port = Integer.parseInt(System.getenv("PORT"));
        }
        String host = System.getProperty("smarthome.host", "127.0.0.1");
        boolean devtools = Boolean.getBoolean("smarthome.devtools");
        SmartHomeServer s = new SmartHomeServer(host, port, new DeviceRegistry(), devtools);
        s.start();
        System.out.println("Smart Home web UI running at http://" + ("0.0.0.0".equals(host) ? "localhost" : host)
                + ":" + s.getPort());
        System.out.println("Backend: Java device simulator. No physical hardware is connected.");
        if (devtools) {
            System.out.println("Dev tools enabled: POST /api/dev/devices/{id}/availability");
        }
        if (s.staticDir != null) {
            System.out.println("Serving UI files from " + s.staticDir.toAbsolutePath());
        }
    }

    // ------------------------------------------------------------------ routing

    private void handle(HttpExchange ex) throws IOException {
        try {
            String path = ex.getRequestURI().getPath();
            String method = ex.getRequestMethod();
            if (path.startsWith("/api/")) {
                handleApi(ex, method, path.substring(4));
            } else if ("GET".equals(method) || "HEAD".equals(method)) {
                serveStatic(ex, path);
            } else {
                sendJson(ex, 405, error("Method not allowed"));
            }
        } catch (CommandException e) {
            sendJson(ex, e.getStatus(), error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            sendJson(ex, 400, error("Invalid request: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendJson(ex, 500, error("Server error"));
        } finally {
            ex.close();
        }
    }

    private void handleApi(HttpExchange ex, String method, String path) throws Exception {
        String[] parts = path.replaceAll("^/+|/+$", "").split("/");
        for (int i = 0; i < parts.length; i++) {
            parts[i] = URLDecoder.decode(parts[i], StandardCharsets.UTF_8);
        }
        String root = parts.length > 0 ? parts[0] : "";

        if (root.equals("health") && parts.length == 1) {
            requireMethod(method, "GET");
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("status", "ok");
            m.put("mode", "simulator");
            sendJson(ex, 200, m);
            return;
        }
        if (root.equals("home") && parts.length == 1) {
            requireMethod(method, "GET");
            sendJson(ex, 200, registry.snapshot());
            return;
        }
        if (root.equals("activity") && parts.length == 1) {
            requireMethod(method, "GET");
            sendJson(ex, 200, Map.of("activity", registry.activity()));
            return;
        }
        if (root.equals("devices")) {
            if (parts.length == 1) {
                requireMethod(method, "GET");
                sendJson(ex, 200, Map.of("devices", registry.snapshot().get("devices")));
                return;
            }
            DeviceAdapter a = registry.get(parts[1]);
            if (a == null) {
                throw new CommandException(404, "Unknown device '" + parts[1] + "'.");
            }
            if (parts.length == 2) {
                requireMethod(method, "GET");
                sendJson(ex, 200, a.toJson());
                return;
            }
            if (parts.length == 3 && parts[2].equals("commands")) {
                requireMethod(method, "POST");
                Map<String, Object> body = readBody(ex);
                Object action = body.get("action");
                if (!(action instanceof String)) {
                    throw CommandException.badRequest("Body must include a string 'action'.");
                }
                sendJson(ex, 200, registry.execute(a.getId(), (String) action, body.get("value"), "web"));
                return;
            }
        }
        if (root.equals("routines")) {
            if (parts.length == 1) {
                requireMethod(method, "GET");
                sendJson(ex, 200, Map.of("routines", Routines.describe()));
                return;
            }
            if (parts.length == 3 && parts[2].equals("run")) {
                requireMethod(method, "POST");
                Map<String, Object> result = Routines.run(registry, parts[1]);
                result.put("devices", registry.snapshot().get("devices"));
                sendJson(ex, 200, result);
                return;
            }
        }
        if (root.equals("dev") && devtools && parts.length == 4
                && parts[1].equals("devices") && parts[3].equals("availability")) {
            requireMethod(method, "POST");
            DeviceAdapter a = registry.get(parts[2]);
            if (a == null) {
                throw new CommandException(404, "Unknown device '" + parts[2] + "'.");
            }
            Object v = readBody(ex).get("available");
            if (!(v instanceof Boolean)) {
                throw CommandException.badRequest("Body must include boolean 'available'.");
            }
            a.setAvailable((Boolean) v);
            sendJson(ex, 200, a.toJson());
            return;
        }
        throw new CommandException(404, "Not found");
    }

    private static void requireMethod(String actual, String expected) throws CommandException {
        if (!expected.equals(actual)) {
            throw new CommandException(405, "Use " + expected + " for this endpoint.");
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> readBody(HttpExchange ex) throws IOException, CommandException {
        byte[] bytes;
        try (InputStream in = ex.getRequestBody()) {
            bytes = in.readNBytes(64 * 1024 + 1);
        }
        if (bytes.length > 64 * 1024) {
            throw new CommandException(413, "Request body too large.");
        }
        String text = new String(bytes, StandardCharsets.UTF_8).trim();
        if (text.isEmpty()) {
            return new LinkedHashMap<>();
        }
        Object parsed;
        try {
            parsed = Json.parse(text);
        } catch (IllegalArgumentException e) {
            throw CommandException.badRequest("Body is not valid JSON.");
        }
        if (!(parsed instanceof Map)) {
            throw CommandException.badRequest("Body must be a JSON object.");
        }
        return (Map<String, Object>) parsed;
    }

    private static Map<String, Object> error(String message) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ok", false);
        m.put("error", message);
        return m;
    }

    private static void sendJson(HttpExchange ex, int status, Object body) throws IOException {
        byte[] bytes = Json.write(body).getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.getResponseHeaders().set("Cache-Control", "no-store");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    // ------------------------------------------------------------ static files

    private static Path findStaticDir() {
        String configured = System.getProperty("smarthome.static");
        if (configured != null) {
            return Paths.get(configured);
        }
        for (String candidate : new String[] {"smarthome/web/static", "web/static", "static"}) {
            Path p = Paths.get(candidate);
            if (Files.isRegularFile(p.resolve("index.html"))) {
                return p;
            }
        }
        return null; // fall back to the classpath
    }

    private void serveStatic(HttpExchange ex, String path) throws IOException {
        if (path.equals("/") || path.isEmpty()) {
            path = "/index.html";
        }
        if (path.contains("..") || path.contains("\\")) {
            sendJson(ex, 400, error("Bad path"));
            return;
        }
        byte[] bytes = null;
        if (staticDir != null) {
            Path file = staticDir.resolve(path.substring(1)).normalize();
            if (file.startsWith(staticDir.normalize()) && Files.isRegularFile(file)) {
                bytes = Files.readAllBytes(file);
            }
        } else {
            try (InputStream in = SmartHomeServer.class.getResourceAsStream("/smarthome/web/static" + path)) {
                if (in != null) {
                    bytes = in.readAllBytes();
                }
            }
        }
        if (bytes == null) {
            sendJson(ex, 404, error("Not found"));
            return;
        }
        ex.getResponseHeaders().set("Content-Type", contentType(path));
        ex.getResponseHeaders().set("Cache-Control", "no-cache");
        if ("HEAD".equals(ex.getRequestMethod())) {
            ex.sendResponseHeaders(200, -1);
            return;
        }
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String contentType(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html; charset=utf-8";
        if (p.endsWith(".css")) return "text/css; charset=utf-8";
        if (p.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }
}
