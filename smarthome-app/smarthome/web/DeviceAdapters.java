package smarthome.web;

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
 * One adapter per existing device class. Each maps web commands onto the
 * same public methods the console controller (SmartHomeController) calls.
 */
public final class DeviceAdapters {

    private DeviceAdapters() {
    }

    // ------------------------------------------------------------------ lights
    public static final class Light extends DeviceAdapter {
        private final LightsControl d;

        public Light(String id, String name, String room, LightsControl d) {
            super(id, name, "light", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("on", d.isOn(), "color", d.getColor(), "brightness", d.getBrightness());
        }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(
                    toggle("Power", "on", "turnOn", "turnOff"),
                    range("setBrightness", "Brightness", "brightness", 1, 100, 1, "%"),
                    map("kind", "color", "action", "setColor", "label", "Colour", "stateKey", "color",
                            "note", "Setting a colour also switches the light on (existing LightsControl behaviour)."));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "setColor": {
                    String c = text(value, "Colour");
                    if (c.length() > 32 || !c.matches("[#A-Za-z0-9 ]+")) {
                        throw CommandException.badRequest("Colour must be a colour name or a hex value like #ffcc88.");
                    }
                    d.setColor(c);
                    break;
                }
                case "setBrightness": accepted(d.setBrightness(integer(value, "Brightness"))); break;
                default: throw unknown(action);
            }
        }
    }

    // ---------------------------------------------------------------- curtains
    public static final class Curtains extends DeviceAdapter {
        private final CurtainsControl d;

        public Curtains(String id, String name, String room, CurtainsControl d) {
            super(id, name, "curtains", room);
            this.d = d;
        }

        public Map<String, Object> state() { return map("open", d.isOpen()); }

        public boolean isActive() { return d.isOpen(); }

        public boolean isPowered() { return false; }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Curtains", "open", "open", "close"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "open": d.open(); break;
                case "close": d.close(); break;
                default: throw unknown(action);
            }
        }
    }

    // --------------------------------------------------------------------- A.C.
    public static final class AirCon extends DeviceAdapter {
        private final AirConditioning d;

        public AirCon(String id, String name, String room, AirConditioning d) {
            super(id, name, "ac", room);
            this.d = d;
        }

        public Map<String, Object> state() { return map("on", d.isOn(), "temperature", d.getTemperature()); }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Power", "on", "turnOn", "turnOff"),
                    range("setTemperature", "Target temperature", "temperature", 20, 31, 0.5, "°C"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "setTemperature": accepted(d.setTemperature((float) number(value, "Temperature"))); break;
                default: throw unknown(action);
            }
        }
    }

    // ------------------------------------------------------------------ heater
    public static final class Heater extends DeviceAdapter {
        private final HeatingSystem d;

        public Heater(String id, String name, String room, HeatingSystem d) {
            super(id, name, "heater", room);
            this.d = d;
        }

        public Map<String, Object> state() { return map("on", d.isOn(), "temperature", d.getTemperature()); }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Power", "on", "turnOn", "turnOff"),
                    range("setTemperature", "Target temperature", "temperature", 20, 35, 0.5, "°C"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "setTemperature": accepted(d.setTemperature((float) number(value, "Temperature"))); break;
                default: throw unknown(action);
            }
        }
    }

    // ---------------------------------------------------------------------- TV
    public static final class Tv extends DeviceAdapter {
        private final EntertainmentSystem d;

        public Tv(String id, String name, String room, EntertainmentSystem d) {
            super(id, name, "tv", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("on", d.isOn(), "channel", d.getChannel(), "volume", d.getVolume());
        }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Power", "on", "turnOn", "turnOff"),
                    map("kind", "number", "action", "changeChannel", "label", "Channel", "stateKey", "channel",
                            "min", 1, "max", 500, "step", 1),
                    range("adjustVolume", "Volume", "volume", 0, 100, 1, ""));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "changeChannel": accepted(d.changeChannel(integer(value, "Channel"))); break;
                case "adjustVolume": accepted(d.adjustVolume(integer(value, "Volume"))); break;
                default: throw unknown(action);
            }
        }
    }

    // ------------------------------------------------------------------- music
    public static final class Music extends DeviceAdapter {
        private final MusicSystem d;

        public Music(String id, String name, String room, MusicSystem d) {
            super(id, name, "music", room);
            this.d = d;
        }

        public Map<String, Object> state() { return map("playing", d.isPlaying()); }

        public boolean isActive() { return d.isPlaying(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Playback", "playing", "play", "pause"),
                    button("previousTrack", "Previous"),
                    button("nextTrack", "Next"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "play": d.play(); break;
                case "pause": d.pause(); break;
                case "nextTrack": d.nextTrack(); break;
                case "previousTrack": d.previousTrack(); break;
                default: throw unknown(action);
            }
        }
    }

    // ------------------------------------------------------------------ vacuum
    public static final class Vacuum extends DeviceAdapter {
        private final SmartVacuum d;

        public Vacuum(String id, String name, String room, SmartVacuum d) {
            super(id, name, "vacuum", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("cleaning", d.isCleaning(), "battery", d.getBatteryStatus());
        }

        public boolean isActive() { return d.isCleaning(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Cleaning", "cleaning", "startCleaning", "stopCleaning"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                // Same pairs of calls as SmartHomeController.controlSmartVacuum
                case "startCleaning": d.startCleaning(); d.notifyUser(); break;
                case "stopCleaning": d.stopCleaning(); d.notifyUser(); break;
                default: throw unknown(action);
            }
        }
    }

    // ------------------------------------------------------------ refrigerator
    public static final class Fridge extends DeviceAdapter {
        private final Refrigerator d;

        public Fridge(String id, String name, String room, Refrigerator d) {
            super(id, name, "fridge", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("on", d.isOn(), "temperature", d.checkTemperature(), "doorOpen", d.isDoorOpen());
        }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Power", "on", "turnOn", "turnOff"),
                    range("setTemperature", "Temperature", "temperature", -5, 7, 1, "°C"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "setTemperature": accepted(d.change_temp(integer(value, "Temperature"))); break;
                default: throw unknown(action);
            }
        }
    }

    // ---------------------------------------------------------- smoke detector
    public static final class Smoke extends DeviceAdapter {
        private final SmokeDetector d;

        public Smoke(String id, String name, String room, SmokeDetector d) {
            super(id, name, "smoke", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("armed", d.isArmed(), "alarmSounding", d.isAlarmSounding(), "smokeDetected", d.isSmokeDetected());
        }

        public boolean isActive() { return d.isArmed(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Detector", "armed", "turnOn", "turnOff"),
                    button("activateAlarm", "Test alarm"),
                    button("deactivateAlarm", "Silence alarm"),
                    button("selfDiagnostic", "Self-diagnostic"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "activateAlarm":
                    if (!d.isArmed()) {
                        throw CommandException.badRequest("Switch the smoke detector on before testing the alarm.");
                    }
                    d.activateAlarm();
                    break;
                case "deactivateAlarm": d.deactivateAlarm(); break;
                case "selfDiagnostic": d.selfDiagnostic(); break;
                default: throw unknown(action);
            }
        }
    }

    // ------------------------------------------------------------- garage door
    public static final class Garage extends DeviceAdapter {
        private final GarageDoor d;

        public Garage(String id, String name, String room, GarageDoor d) {
            super(id, name, "garageDoor", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("open", d.isDoorOpen(), "scheduledOpening", d.getScheduledOpening());
        }

        public boolean isActive() { return d.isDoorOpen(); }

        public boolean isPowered() { return false; }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Door", "open", "openDoor", "closeDoor"),
                    map("kind", "time", "action", "scheduleOpening", "label", "Schedule opening",
                            "stateKey", "scheduledOpening",
                            "note", "The existing GarageDoor class only records the schedule; it does not open the door automatically."));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "openDoor": d.openDoor(); break;
                case "closeDoor": d.closeDoor(); break;
                case "scheduleOpening": {
                    if (!(value instanceof Map)) {
                        throw CommandException.badRequest("Schedule needs an hour and a minute.");
                    }
                    Map<?, ?> v = (Map<?, ?>) value;
                    int h = integer(v.get("hour"), "Hour");
                    int m = integer(v.get("minute"), "Minute");
                    if (h < 0 || h > 23 || m < 0 || m > 59) {
                        throw CommandException.badRequest("Hour must be 0-23 and minute 0-59.");
                    }
                    d.scheduleOpening(h, m);
                    break;
                }
                default: throw unknown(action);
            }
        }
    }

    // ---------------------------------------------------------- energy monitor
    public static final class Energy extends DeviceAdapter {
        private final EnergyMonitor d;

        public Energy(String id, String name, String room, EnergyMonitor d) {
            super(id, name, "energy", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("on", d.isOn(), "powerSaving", d.isPowerSavingMode());
        }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Monitor", "on", "turnOn", "turnOff"),
                    toggle("Power saving", "powerSaving", "enablePowerSavingMode", "disablePowerSavingMode"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "enablePowerSavingMode": d.enablePowerSavingMode(); break;
                case "disablePowerSavingMode": d.disablePowerSavingMode(); break;
                default: throw unknown(action);
            }
        }
    }

    // --------------------------------------------------------------- door lock
    public static final class Lock extends DeviceAdapter {
        private final DoorLock d;

        public Lock(String id, String name, String room, DoorLock d) {
            super(id, name, "lock", room);
            this.d = d;
        }

        public Map<String, Object> state() { return map("locked", d.isDoorLocked()); }

        public boolean isActive() { return d.isDoorLocked(); }

        public boolean isPowered() { return false; }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Lock", "locked", "lockDoor", "unlockDoor"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "lockDoor": d.lockDoor(); break;
                case "unlockDoor": d.unlockDoor(); break;
                default: throw unknown(action);
            }
        }
    }

    // ---------------------------------------------------------- security camera
    public static final class Camera extends DeviceAdapter {
        private final SecuritySystem d;

        public Camera(String id, String name, String room, SecuritySystem d) {
            super(id, name, "camera", room);
            this.d = d;
        }

        public Map<String, Object> state() { return map("on", d.isActive()); }

        public boolean isActive() { return d.isActive(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Camera", "on", "turnOn", "turnOff"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                default: throw unknown(action);
            }
        }
    }

    // --------------------------------------------------------------- sprinkler
    public static final class Sprinkler extends DeviceAdapter {
        private final WaterSprinkler d;

        public Sprinkler(String id, String name, String room, WaterSprinkler d) {
            super(id, name, "sprinkler", room);
            this.d = d;
        }

        public Map<String, Object> state() {
            return map("on", d.isOn(), "scheduleMinutes", d.getScheduleMinutes());
        }

        public boolean isActive() { return d.isOn(); }

        public List<Map<String, Object>> capabilities() {
            return list(toggle("Water", "on", "turnOn", "turnOff"),
                    range("setSchedule", "Timer", "scheduleMinutes", 1, 120, 1, "min"));
        }

        public void execute(String action, Object value) throws CommandException {
            switch (action) {
                case "turnOn": d.turnOn(); break;
                case "turnOff": d.turnOff(); break;
                case "setSchedule": accepted(d.setschedule(integer(value, "Minutes"))); break;
                default: throw unknown(action);
            }
        }
    }
}
