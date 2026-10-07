package smarthome.devices;

import smarthome.Device;

public class Refrigerator implements Device {
    private boolean isOn = true; // added so on/off state can be reported (a fridge normally starts running)
    private int temperature = 3;
    private boolean doorOpen = false;

    @Override
    public void turnOn() {
        isOn = true;
        System.out.println("Refrigerator is ON.");
    }

    @Override
    public void turnOff() {
        isOn = false;
        System.out.println("Refrigerator is OFF.");
    }

    public int checkTemperature() {
        return temperature;
    }

    public boolean isDoorOpen() {
        return doorOpen;
    }

    public boolean isOn() {
        return isOn;
    }

    /** @return true if accepted (return value added for the web API). */
    public boolean change_temp(int newTemperature) {
        try {
            if (newTemperature < -5 || newTemperature > 7) {
                throw new IllegalArgumentException("Invalid  temperature. Valid range is -5 to 7.");
            }
            temperature = newTemperature;
            System.out.println("the temperature of the refrigerator is now set to " + newTemperature + " °C");
            if (newTemperature > 5) {
                notifyUser();
            }
            return true;
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
            return false;
        }
    }

    public void notifyUser() {
        System.out.println("Alert: Refrigerator door has been left open!");
    }
}