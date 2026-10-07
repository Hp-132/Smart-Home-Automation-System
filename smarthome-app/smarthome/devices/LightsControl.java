//done 
package smarthome.devices;

import smarthome.Device;

public class LightsControl implements Device {
    private boolean isOn = false;
    private String color = "white";
    // Added for the web UI: simulated brightness level (0-100). Not in the original console menu.
    private int brightness = 80;

    @Override
    public void turnOn() {
        isOn = true;
        System.out.println("The lights are ON.");
    }

    @Override
    public void turnOff() {
        isOn = false; // fix: previously the state was never reset to off
        System.out.println("The lights are OFF.");
    }

    public void setColor(String c) {
        isOn = true;
        color = c;
        System.out.println("The color of the light is successfully set to " + color);
    }

    public boolean setBrightness(int level) {
        if (level < 1 || level > 100) {
            System.out.println("Error: Invalid brightness. Valid range is 1 to 100.");
            return false;
        }
        brightness = level;
        System.out.println("The brightness of the light is set to " + level + "%");
        return true;
    }

    public boolean isOn() {
        return isOn;
    }

    public String getColor() {
        return color;
    }

    public int getBrightness() {
        return brightness;
    }

}
