package smarthome.devices;

import smarthome.Device;

public class EntertainmentSystem implements Device {
    private boolean isOn = false;
    private int channel = 1;
    private int volume = 10;

    @Override
    public void turnOn() {
        isOn = true;
        System.out.println("Entertainment System is ON.");
    }

    @Override
    public void turnOff() {
        isOn = false;
        System.out.println("Entertainment System is OFF.");
    }

    /** @return true if accepted (return value added for the web API). */
    public boolean changeChannel(int channel) {
        try {
            if (channel < 1 || channel > 500) {
                throw new IllegalArgumentException("Invalid channel number Valid range is 1 to 500.");
            }
            this.channel = channel;
            System.out.println("Channel changed to " + channel);
            return true;
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
            return false;
        }

    }

    /** @return true if accepted (return value added for the web API). */
    public boolean adjustVolume(int volume) {
        try {
            if (volume < 0 || volume > 100) {
                throw new IllegalArgumentException("Invalid volume level. Valid range is 0 to 100.");
            }
            this.volume = volume;
            System.out.println("Volume set to " + volume);
            displayTV();
            return true;
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
            return false;
        }
    }

    public boolean isOn() {
        return isOn;
    }

    public int getChannel() {
        return channel;
    }

    public int getVolume() {
        return volume;
    }

    public void displayTV() {
        System.out.println("       __________________________________     ");
        System.out.println("      |   ____________________________   |");
        System.out.println("      |  | Volume set to : " + volume + "         |  |");
        System.out.println("      |  |                            |  |");
        System.out.println("      |  |                            |  |");
        System.out.println("      |  |                            |  |");
        System.out.println("      |  |                            |  |");
        System.out.println("      |  |____________________________|  |");
        System.out.println("      |__________________________________|");
        System.out.println("                     |     |        ");
        System.out.println("                _________________       ");
    }

}
