package smarthome.devices;

import smarthome.Device;

public class WaterSprinkler {
    private boolean isOn = false;
    private int minutes = 0;

    public void turnOn() {
        isOn = true;
        System.out.println("The water sprinkler is ON now.");
    }

    public void turnOff() {
        isOn = false; // fix: previously the state was never reset to off
        System.out.println("The water sprinkler is OFF now.");
    }

    /** @return true if accepted (return value added for the web API). */
    public boolean setschedule(int m) {
        try {
            if (m < 1 || m > 120) {
                throw new IllegalArgumentException("You are Wasting water!");
            }
            minutes = m;
            System.out.println("The scheduled time for the water sprinkler is set to " + minutes + " minutes");
            return true;
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
            return false;
        }
    }

    public boolean isOn() {
        return isOn;
    }

    public int getScheduleMinutes() {
        return minutes;
    }
}
