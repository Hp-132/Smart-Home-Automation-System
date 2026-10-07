//done
package smarthome.devices;
public class DoorLock {
    private boolean locked=false;
    public void lockDoor(){
        locked=true;
        System.out.println("locking the door...");
    }
    public void unlockDoor(){
        locked=false;
        System.out.println("unlocking the door...");
    }

    public void isLocked(){
        if(locked){
            System.out.println("the door is locked currently");
        }
        else{
            System.out.println("the door is unlocked currently");
        }
    }

    // Added for the web API: returns the state instead of printing it.
    public boolean isDoorLocked(){
        return locked;
    }


}
