//done
package smarthome.devices;

import smarthome.Device;

public class AirConditioning implements Device {
    private boolean isOn = false;
    private float temperature = 24;

    @Override
    public void turnOn() {
        isOn = true;
        System.out.println("The A.C. is ON.");
    }

    @Override
    public void turnOff() {
        isOn = false;
        System.out.println("The A.C. is OFF.");
    }

    /** @return true if the temperature was accepted (return value added for the web API). */
    public boolean setTemperature(float t) {
        try {
            if (t < 20 || t > 31) {
                throw new IllegalArgumentException("Invalid  temperature. Valid range is 20 to 31.");
            }
            temperature = t;
            System.out.println("the temperature of the A.C. is now set to " + t + " °C");
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
