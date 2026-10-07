package smarthome.devices;

import smarthome.Device;

public class EnergyMonitor implements Device {

    private boolean isOn = false; // added so on/off state can be reported
    private boolean powerSavingMode = false;

    @Override
    public void turnOn() {
        isOn = true;
        System.out.println("Energy Monitor is ON.");
    }

    @Override
    public void turnOff() {
        isOn = false;
        System.out.println("Energy Monitor is OFF.");
    }

    public void enablePowerSavingMode() {
        powerSavingMode = true;
        System.out.println("Power Saving Mode ENABLED.");
    }

    public void disablePowerSavingMode() {
        powerSavingMode = false;
        System.out.println("Power Saving Mode DISABLED.");
    }

    public boolean isOn() {
        return isOn;
    }

    public boolean isPowerSavingMode() {
        return powerSavingMode;
    }

}
