package smarthome.web;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Wraps one existing device object (from smarthome.devices / smarthome.sensors)
 * and describes it to the web UI: its state, and the commands it really supports.
 * Adapters never hold device state themselves; they always read it from the device.
 */
public abstract class DeviceAdapter {

    private final String id;
    private final String name;
    private final String type;
    private final String room;
    private volatile boolean available = true;

    protected DeviceAdapter(String id, String name, String type, String room) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.room = room;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getRoom() { return room; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    /** Current state, read from the wrapped device. */
    public abstract Map<String, Object> state();

    /** Whether the device is switched on / running. Only meaningful when {@link #isPowered()}. */
    public abstract boolean isActive();

    /** False for devices that have a position rather than power (curtains, doors, locks). */
    public boolean isPowered() { return true; }

    /** Commands the device supports, described for the UI. */
    public abstract List<Map<String, Object>> capabilities();

    /** Runs a command on the wrapped device. */
    public abstract void execute(String action, Object value) throws CommandException;

    public Map<String, Object> toJson() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("type", type);
        m.put("room", room);
        m.put("available", available);
        m.put("powered", isPowered());
        m.put("active", isActive());
        m.put("state", state());
        m.put("capabilities", capabilities());
        return m;
    }

    // ---------- helpers for subclasses ----------

    protected static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], kv[i + 1]);
        }
        return m;
    }

    @SafeVarargs
    protected static List<Map<String, Object>> list(Map<String, Object>... items) {
        List<Map<String, Object>> l = new ArrayList<>();
        for (Map<String, Object> i : items) {
            l.add(i);
        }
        return l;
    }

    protected static Map<String, Object> toggle(String label, String stateKey, String onAction, String offAction) {
        return map("kind", "toggle", "label", label, "stateKey", stateKey, "onAction", onAction, "offAction", offAction);
    }

    protected static Map<String, Object> button(String action, String label) {
        return map("kind", "button", "action", action, "label", label);
    }

    protected static Map<String, Object> range(String action, String label, String stateKey,
                                               double min, double max, double step, String unit) {
        return map("kind", "range", "action", action, "label", label, "stateKey", stateKey,
                "min", min, "max", max, "step", step, "unit", unit);
    }

    protected static double number(Object value, String what) throws CommandException {
        if (value instanceof Number) {
            double d = ((Number) value).doubleValue();
            if (!Double.isNaN(d) && !Double.isInfinite(d)) {
                return d;
            }
        }
        if (value instanceof String) {
            try {
                return Double.parseDouble(((String) value).trim());
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        throw CommandException.badRequest(what + " must be a number.");
    }

    protected static int integer(Object value, String what) throws CommandException {
        double d = number(value, what);
        if (d != Math.rint(d)) {
            throw CommandException.badRequest(what + " must be a whole number.");
        }
        return (int) d;
    }

    protected static String text(Object value, String what) throws CommandException {
        if (value instanceof String && !((String) value).trim().isEmpty()) {
            return ((String) value).trim();
        }
        throw CommandException.badRequest(what + " is required.");
    }

    /** Converts a device's false return value (validation failed) into an error. */
    protected static void accepted(boolean ok) throws CommandException {
        if (!ok) {
            // The device printed the reason; the registry replaces this message with it.
            throw new CommandException(400, "Rejected by device");
        }
    }

    protected CommandException unknown(String action) {
        return new CommandException(400, "Unsupported action '" + action + "' for " + name + ".");
    }
}
