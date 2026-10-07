package smarthome.devices;

import smarthome.Device;

public class SmartVacuum implements Device {
    private boolean isCleaning = false;

    @Override
    public void turnOn() {
        startCleaning();
    }

    @Override
    public void turnOff() {
        stopCleaning();
    }

    public void startCleaning() {
        isCleaning = true;
        System.out.println("Smart Vacuum Cleaner started cleaning.");

        showCleaningStatus();

        notifyUser();

    }

    public void stopCleaning() {
        isCleaning = false;
        System.out.println("Smart Vacuum Cleaner stopped cleaning.");
    }

    public boolean isCleaning() {
        return isCleaning;
    }

    public int getBatteryStatus() {
        return 75;
    }

    private void showCleaningStatus() {
        String statusMessage = isCleaning ? "Currently cleaning..." : "Not cleaning.";
        System.out.println(statusMessage);
    }

    public void notifyUser() {
        if (isCleaning) {
            System.out.println("Notification: Cleaning in progress...");
        } else {
            System.out.println("Notification: Cleaning stopped.");
        }
    }
}