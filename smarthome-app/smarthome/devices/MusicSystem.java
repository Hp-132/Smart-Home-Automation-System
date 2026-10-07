package smarthome.devices;

import smarthome.Device;

public class MusicSystem implements Device {
    private boolean isPlaying = false;

    @Override
    public void turnOn() {
        isPlaying = true;
        System.out.println("Music System is ON.");
    }

    @Override
    public void turnOff() {
        isPlaying = false;
        System.out.println("Music System is OFF.");
    }

    public void play() {
        if (!isPlaying) {
            isPlaying = true;
            System.out.println("Playing music.");
        }
    }

    public void pause() {
        if (isPlaying) {
            isPlaying = false;
            System.out.println("Music paused.");
        }
    }

    public boolean isPlaying() {
        return isPlaying;
    }

    public void nextTrack() {
        System.out.println("Playing next track.");
    }

    public void previousTrack() {
        System.out.println("Playing previous track.");
    }

}