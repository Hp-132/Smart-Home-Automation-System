package smarthome.web;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import smarthome.devices.AirConditioning;
import smarthome.devices.CurtainsControl;
import smarthome.devices.DoorLock;
import smarthome.devices.EnergyMonitor;
import smarthome.devices.EntertainmentSystem;
import smarthome.devices.GarageDoor;
import smarthome.devices.HeatingSystem;
import smarthome.devices.LightsControl;
import smarthome.devices.MusicSystem;
import smarthome.devices.Refrigerator;
import smarthome.devices.SecuritySystem;
import smarthome.devices.SmartVacuum;
import smarthome.devices.WaterSprinkler;
import smarthome.sensors.SmokeDetector;

/**
 * Holds the device instances used by the web server and runs commands on them.
 *
 * The console controller creates one instance of each device class. For the house
 * view, the same classes are instantiated per room (for example one LightsControl per
 * room). All devices are the existing in-memory simulators; no hardware is contacted.
 */
public class DeviceRegistry {

    private final Map<String, Map<String, Object>> rooms = new LinkedHashMap<>();
    private final Map<String, DeviceAdapter> devices = new LinkedHashMap<>();
    private final Deque<Map<String, Object>> activity = new ArrayDeque<>();
    private final Object lock = new Object();
    private static final int ACTIVITY_LIMIT = 40;

    public DeviceRegistry() {
        room("living", "Living room");
        room("kitchen", "Kitchen");
        room("garage", "Garage");
        room("bedroom", "Bedroom");
        room("bathroom", "Bathroom");
        room("outdoor", "Garden & entry");

        add(new DeviceAdapters.Light("living-light", "Pendant light", "living", new LightsControl()));
        add(new DeviceAdapters.Curtains("living-curtains", "Window curtains", "living", new CurtainsControl()));
        add(new DeviceAdapters.Tv("living-tv", "Television", "living", new EntertainmentSystem()));
        add(new DeviceAdapters.Music("living-music", "Music system", "living", new MusicSystem()));
        add(new DeviceAdapters.AirCon("living-ac", "Air conditioner", "living", new AirConditioning()));
        add(new DeviceAdapters.Vacuum("living-vacuum", "Robot vacuum", "living", new SmartVacuum()));

        add(new DeviceAdapters.Light("kitchen-light", "Island pendant", "kitchen", new LightsControl()));
        add(new DeviceAdapters.Fridge("kitchen-fridge", "Refrigerator", "kitchen", new Refrigerator()));
        add(new DeviceAdapters.Smoke("kitchen-smoke", "Smoke detector", "kitchen", new SmokeDetector()));

        add(new DeviceAdapters.Light("garage-light", "Garage light", "garage", new LightsControl()));
        add(new DeviceAdapters.Garage("garage-door", "Garage door", "garage", new GarageDoor()));
        add(new DeviceAdapters.Energy("garage-energy", "Energy monitor", "garage", new EnergyMonitor()));

        add(new DeviceAdapters.Light("bedroom-light", "Bedroom light", "bedroom", new LightsControl()));
        add(new DeviceAdapters.Curtains("bedroom-curtains", "Bedroom curtains", "bedroom", new CurtainsControl()));
        add(new DeviceAdapters.AirCon("bedroom-ac", "Air conditioner", "bedroom", new AirConditioning()));

        add(new DeviceAdapters.Light("bathroom-light", "Bathroom light", "bathroom", new LightsControl()));
        add(new DeviceAdapters.Heater("bathroom-heater", "Heater", "bathroom", new HeatingSystem()));

        add(new DeviceAdapters.Light("outdoor-light", "Garden lamp", "outdoor", new LightsControl()));
        add(new DeviceAdapters.Lock("front-door", "Front door lock", "outdoor", new DoorLock()));
        add(new DeviceAdapters.Camera("outdoor-camera", "Security camera", "outdoor", new SecuritySystem()));
        add(new DeviceAdapters.Sprinkler("outdoor-sprinkler", "Water sprinkler", "outdoor", new WaterSprinkler()));
    }

    private void room(String id, String name) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", id);
        r.put("name", name);
        rooms.put(id, r);
    }

    private void add(DeviceAdapter a) {
        devices.put(a.getId(), a);
    }

    public DeviceAdapter get(String id) {
        return devices.get(id);
    }

    public Collection<DeviceAdapter> all() {
        return devices.values();
    }

    public Map<String, Object> snapshot() {
        synchronized (lock) {
            List<Object> ds = new ArrayList<>();
            for (DeviceAdapter a : devices.values()) {
                ds.add(a.toJson());
            }
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("backend", map("mode", "simulator",
                    "description", "Java device simulator (smarthome.devices). No physical hardware is connected.",
                    "time", Instant.now().toString()));
            m.put("rooms", new ArrayList<>(rooms.values()));
            m.put("devices", ds);
            m.put("routines", Routines.describe());
            return m;
        }
    }

    public List<Map<String, Object>> activity() {
        synchronized (lock) {
            return new ArrayList<>(activity);
        }
    }

    /**
     * Runs one command. Console output printed by the device class is captured and
     * returned as the device's message, so the UI shows exactly what the backend did.
     */
    public Map<String, Object> execute(String deviceId, String action, Object value, String source)
            throws CommandException {
        DeviceAdapter a = devices.get(deviceId);
        if (a == null) {
            throw new CommandException(404, "Unknown device '" + deviceId + "'.");
        }
        if (action == null || action.isEmpty()) {
            throw CommandException.badRequest("Missing 'action'.");
        }
        synchronized (lock) {
            if (!a.isAvailable()) {
                CommandException ex = new CommandException(503, a.getName() + " is not responding.");
                log(a, action, false, List.of(ex.getMessage()), source);
                throw ex;
            }
            List<String> messages;
            CommandException failure = null;
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            PrintStream original = System.out;
            System.setOut(new PrintStream(new Tee(original, buf), true, StandardCharsets.UTF_8));
            try {
                a.execute(action, value);
            } catch (CommandException e) {
                failure = e;
            } catch (RuntimeException e) {
                failure = new CommandException(500, "Device error: " + e.getMessage());
            } finally {
                System.out.flush();
                System.setOut(original);
            }
            messages = cleanOutput(buf.toString(StandardCharsets.UTF_8));
            if (failure != null) {
                String msg = failure.getMessage();
                for (String line : messages) {
                    if (line.startsWith("Error:")) {
                        msg = line.substring(6).trim().replaceAll("\\s+", " ");
                    }
                }
                log(a, action, false, List.of(msg), source);
                throw new CommandException(failure.getStatus(), msg);
            }
            log(a, action, true, messages, source);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("ok", true);
            result.put("device", a.toJson());
            result.put("messages", messages);
            return result;
        }
    }

    private void log(DeviceAdapter a, String action, boolean ok, List<String> messages, String source) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("time", Instant.now().toString());
        e.put("deviceId", a.getId());
        e.put("deviceName", a.getName());
        e.put("room", a.getRoom());
        e.put("action", action);
        e.put("ok", ok);
        e.put("source", source);
        e.put("messages", messages);
        activity.addFirst(e);
        while (activity.size() > ACTIVITY_LIMIT) {
            activity.removeLast();
        }
    }

    /** Keeps readable lines and drops the ASCII-art TV drawing printed by EntertainmentSystem. */
    static List<String> cleanOutput(String out) {
        List<String> lines = new ArrayList<>();
        for (String raw : out.split("\\R")) {
            String line = raw.trim();
            if (line.isEmpty() || line.contains("|") || !line.matches(".*[A-Za-z].*")) {
                continue;
            }
            lines.add(line);
        }
        return lines;
    }

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], kv[i + 1]);
        }
        return m;
    }

    /** Writes to the real console and to a buffer at the same time. */
    private static final class Tee extends OutputStream {
        private final OutputStream a;
        private final OutputStream b;

        Tee(OutputStream a, OutputStream b) {
            this.a = a;
            this.b = b;
        }

        @Override
        public void write(int c) throws java.io.IOException {
            a.write(c);
            b.write(c);
        }

        @Override
        public void write(byte[] bytes, int off, int len) throws java.io.IOException {
            a.write(bytes, off, len);
            b.write(bytes, off, len);
        }

        @Override
        public void flush() throws java.io.IOException {
            a.flush();
            b.flush();
        }
    }
}
