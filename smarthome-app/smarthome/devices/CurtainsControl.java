package smarthome.devices;

public class CurtainsControl {
    // Added so the current position can be reported. Hardware model is open/closed only.
    private boolean isOpen = true;

    public void open() {
        isOpen = true;
        System.out.println("Opening the curatains....");
    }

    public void close() {
        isOpen = false;
        System.out.println("Closing the curtains...");
    }

    public boolean isOpen() {
        return isOpen;
    }
}
