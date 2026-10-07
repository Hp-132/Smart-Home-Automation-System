package smarthome.devices;

import smarthome.Device;

public class HeatingSystem {
    private boolean isOn = false; // added so on/off state can be reported
    private float temperature = 28.5f;

    public void turnOn() {
        isOn = true;
        System.out.println("The heater is ON.");
    }

    public void turnOff() {
        isOn = false;
        System.out.println("The heater is OFF.");
    }

    /** @return true if the temperature was accepted (return value added for the web API). */
    public boolean setTemperature(float t) {
        try {
            if (t < 20 || t > 35) {
                throw new IllegalArgumentException("Invalid  temperature. Valid range is 20 to 35.");
            }
            temperature = t;
            System.out.println("the temperature of the heater is now set to " + t + " °C");
            return true;
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
            return false;
        }
    }

    public boolean isOn() {
        return isOn;
    }

    public float getTemperature() {
        return temperature;
    }

}
