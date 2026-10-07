package smarthome.web;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Routines are sequences of ordinary device commands. They only use actions the
 * device classes already support, and they go through DeviceRegistry.execute, so
 * each step is validated and logged like a manual command.
 */
public final class Routines {

    private Routines() {
    }

    /** One step: every device of {@code type} whose state[key] != target gets {@code action}. */
    private static final class Step {
        final String type;
        final String key;
        final Object target;
        final String action;

        Step(String type, String key, Object target, String action) {
            this.type = type;
            this.key = key;
            this.target = target;
            this.action = action;
        }
    }

    private static final class Routine {
        final String id;
        final String name;
        final String description;
        final List<Step> steps;

        Routine(String id, String name, String description, List<Step> steps) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.steps = steps;
        }
    }

    private static final List<Routine> ROUTINES = List.of(
            new Routine("all-lights-off", "All lights off", "Switches off every light in the house.",
                    List.of(new Step("light", "on", false, "turnOff"))),
            new Routine("night", "Night mode",
                    "Lights off, curtains closed, TV and music off, front door locked, garage closed, camera and smoke detector on.",
                    List.of(new Step("light", "on", false, "turnOff"),
                            new Step("curtains", "open", false, "close"),
                            new Step("tv", "on", false, "turnOff"),
                            new Step("music", "playing", false, "pause"),
                            new Step("lock", "locked", true, "lockDoor"),
                            new Step("garageDoor", "open", false, "closeDoor"),
                            new Step("camera", "on", true, "turnOn"),
                            new Step("smoke", "armed", true, "turnOn"))),
            new Routine("away", "Away mode",
                    "Lights, climate, TV, music and sprinkler off; front door locked, garage closed, camera on.",
                    List.of(new Step("light", "on", false, "turnOff"),
                            new Step("ac", "on", false, "turnOff"),
                            new Step("heater", "on", false, "turnOff"),
                            new Step("tv", "on", false, "turnOff"),
                            new Step("music", "playing", false, "pause"),
                            new Step("sprinkler", "on", false, "turnOff"),
                            new Step("lock", "locked", true, "lockDoor"),
                            new Step("garageDoor", "open", false, "closeDoor"),
                            new Step("camera", "on", true, "turnOn"))));

    public static List<Map<String, Object>> describe() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Routine r : ROUTINES) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.id);
            m.put("name", r.name);
            m.put("description", r.description);
            out.add(m);
        }
        return out;
    }

    public static Map<String, Object> run(DeviceRegistry registry, String routineId) throws CommandException {
        Routine routine = null;
        for (Routine r : ROUTINES) {
            if (r.id.equals(routineId)) {
                routine = r;
            }
        }
        if (routine == null) {
            throw new CommandException(404, "Unknown routine '" + routineId + "'.");
        }
        List<Map<String, Object>> results = new ArrayList<>();
        int sent = 0;
        int failed = 0;
        for (Step step : routine.steps) {
            for (DeviceAdapter a : registry.all()) {
                if (!a.getType().equals(step.type)) {
                    continue;
                }
                if (a.isAvailable() && Objects.equals(a.state().get(step.key), step.target)) {
                    continue; // already in the requested state; nothing to send
                }
                Map<String, Object> res = new LinkedHashMap<>();
                res.put("deviceId", a.getId());
                res.put("deviceName", a.getName());
                res.put("action", step.action);
                try {
                    registry.execute(a.getId(), step.action, null, "routine:" + routine.id);
                    res.put("ok", true);
                    sent++;
                } catch (CommandException e) {
                    res.put("ok", false);
                    res.put("error", e.getMessage());
                    failed++;
                }
                results.add(res);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ok", failed == 0);
        out.put("routine", routine.id);
        out.put("name", routine.name);
        out.put("commandsSent", sent);
        out.put("commandsFailed", failed);
        out.put("results", results);
        return out;
    }
}
