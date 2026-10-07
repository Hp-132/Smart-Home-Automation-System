package smarthome.devices;

import smarthome.Device;

public class GarageDoor implements Device {
    private boolean doorOpen = false;
    private String scheduledOpening = null; // added: last requested schedule (HH:MM), logged only

    @Override
    public void turnOn() {
        openDoor();
    }

    @Override
    public void turnOff() {
        closeDoor();
    }

    public void openDoor() {
        doorOpen = true;
        System.out.println("Garage Door is OPEN.");
        
     
        showCameraFeed();
        
       
        notifyUser();
        
     }

     public void closeDoor() {
         doorOpen = false;
         System.out.println("Garage Door is CLOSED.");
     }

     public boolean isDoorOpen() {
         return doorOpen;
     }

    
     public void scheduleOpening(int hour, int minute) {
         scheduledOpening = String.format("%02d:%02d", hour, minute);
         System.out.println("Garage Door scheduled to open at " + hour + ":" + minute);
     }

     public String getScheduledOpening() {
         return scheduledOpening;
     }

     public void notifyUser() {
         System.out.println("Garage Door Status: " + (doorOpen ? "OPEN" : "CLOSED"));
     }
     
     private void showCameraFeed() {
         System.out.println("Displaying camera feed for the garage area...");
     }
}