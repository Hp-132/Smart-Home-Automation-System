package smarthome;

import smarthome.devices.*;
import smarthome.sensors.*;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

public class SmartHomeController {

    public static void main(String[] args) {
        try {
            File myObj = new File("C:\\Users\\DELL\\OneDrive\\Desktop\\prac1\\smarthome\\welcome_smarthome.txt");
            Scanner myReader = new Scanner(myObj);
            while (myReader.hasNextLine()) {
                String data = myReader.nextLine();
                System.out.println(data);
            }
            myReader.close();
        } catch (FileNotFoundException e) {
            System.out.println("Welcome to the Smart Home System!");
            System.out.println("Unable to load welcome message from file.");
            e.printStackTrace();
        }

        Scanner scanner = new Scanner(System.in);

        SmokeDetector smokeDetector = new SmokeDetector();
        EntertainmentSystem entertainmentSystem = new EntertainmentSystem();
        Refrigerator refrigerator = new Refrigerator();
        GarageDoor garageDoor = new GarageDoor();
        EnergyMonitor energyMonitor = new EnergyMonitor();
        MusicSystem musicSystem = new MusicSystem();
        SmartVacuum smartVacuum = new SmartVacuum();
        AirConditioning AC = new AirConditioning();
        CurtainsControl curtains = new CurtainsControl();
        DoorLock door = new DoorLock();
        HeatingSystem heater = new HeatingSystem();
        LightsControl lights = new LightsControl();
        SecuritySystem camera = new SecuritySystem();
        WaterSprinkler sprinkler = new WaterSprinkler();

        boolean continueProgram = true;

        while (continueProgram) {
            System.out.println("\n--- Smart Home Controller ---");
            System.out.println("1. Control Smoke Detector");
            System.out.println("2. Control Entertainment System");
            System.out.println("3. Control Refrigerator");
            System.out.println("4. Control Garage Door");
            System.out.println("5. Control Energy Monitor");
            System.out.println("6. Control Music System");
            System.out.println("7. Control Smart Vacuum");
            System.out.println("8. Control A.C.");
            System.out.println("9. Control curtains");
            System.out.println("10. Control door lock");
            System.out.println("11. Control heater");
            System.out.println("12. Control Lights");
            System.out.println("13. Control security camera");
            System.out.println("14. Control water sprinkler");
            System.out.println("15. Exit");
            System.out.print("Select an option (1-15): ");

            int choice = Integer.parseInt(scanner.nextLine());

            boolean continueSameDevice = true;

            while (continueSameDevice) {
                switch (choice) {
                    case 1:
                        controlSmokeDetector(scanner, smokeDetector);
                        break;
                    case 2:
                        controlEntertainmentSystem(scanner, entertainmentSystem);
                        break;
                    case 3:
                        controlRefrigerator(scanner, refrigerator);
                        break;
                    case 4:
                        controlGarageDoor(scanner, garageDoor);
                        break;
                    case 5:
                        controlEnergyMonitor(scanner, energyMonitor);
                        break;
                    case 6:
                        controlMusicSystem(scanner, musicSystem);
                        break;
                    case 7:
                        controlSmartVacuum(scanner, smartVacuum);
                        break;
                    case 8:
                        controlAC(scanner, AC);
                        break;
                    case 9:
                        controlCurtains(scanner, curtains);
                        break;
                    case 10:
                        controlDoor(scanner, door);
                        break;
                    case 11:
                        controlHeater(scanner, heater);
                        break;
                    case 12:
                        controlLights(scanner, lights);
                        break;
                    case 13:
                        controlSecurity(scanner, camera);
                        break;
                    case 14:
                        controlWaterSprinkler(scanner, sprinkler);
                        break;
                    case 15:
                        continueProgram = false;
                        continueSameDevice = false;
                        break;

                    default:
                        System.out.println("Invalid option. Please try again.");
                        continueSameDevice = false;
                }

                if (continueSameDevice) {

                    if (continueDevice(scanner)) {
                        continueSameDevice = true;
                    } else if (continueAnotherDevice(scanner)) {
                        continueSameDevice = false;
                    } else {
                        continueProgram = false;
                        continueSameDevice = false;
                    }
                }
            }
        }

        scanner.close();
    }

    private static void controlSmokeDetector(Scanner scanner, SmokeDetector smokeDetector) {
        System.out.println("\n--- Smoke Detector ---");
        System.out.println("1. Turn On");
        System.out.println("2. Turn Off");
        System.out.println("3. Activate Alarm");
        System.out.println("4. Deactivate Alarm");
        System.out.println("5. Notify User");
        System.out.println("6. Self-Diagnostic");
        System.out.print("Select an action (1-6): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                smokeDetector.turnOn();
                break;
            case 2:
                smokeDetector.turnOff();
                break;
            case 3:
                smokeDetector.activateAlarm();
                break;
            case 4:
                smokeDetector.deactivateAlarm();
                break;
            case 5:
                if (smokeDetector.isSmokeDetected()) {
                    smokeDetector.notifyUser();
                } else {
                    System.out.println("No smoke detected. No notification sent.");
                }
                break;
            case 6:
                smokeDetector.selfDiagnostic();
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlEntertainmentSystem(Scanner scanner, EntertainmentSystem entertainmentSystem) {
        System.out.println("\n--- Entertainment System ---");
        System.out.println("1. Turn On");
        System.out.println("2. Turn Off");
        System.out.println("3. Change Channel");
        System.out.println("4. Adjust Volume");
        System.out.print("Select an action (1-4): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                entertainmentSystem.turnOn();
                break;
            case 2:
                entertainmentSystem.turnOff();
                break;
            case 3:
                System.out.print("Enter channel number: ");
                int channel = Integer.parseInt(scanner.nextLine());
                entertainmentSystem.changeChannel(channel);
                break;
            case 4:
                System.out.print("Enter volume level: ");
                int volume = Integer.parseInt(scanner.nextLine());
                entertainmentSystem.adjustVolume(volume);
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlRefrigerator(Scanner scanner, Refrigerator refrigerator) {
        System.out.println("\n--- Refrigerator ---");
        System.out.println("1. Turn On");
        System.out.println("2. Turn Off");
        System.out.println("3. Check Temperature");
        System.out.println("4. Change Temperature");
        System.out.print("Select an action (1-4): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                refrigerator.turnOn();
                break;
            case 2:
                refrigerator.turnOff();
                break;
            case 3:
                int temperature = refrigerator.checkTemperature();
                System.out.println("Current Temperature: " + temperature + "°C");
                break;
            case 4:
                System.out.print("Enter new temperature: ");
                String input = scanner.nextLine();
                try {
                    int newTemperature = Integer.parseInt(input.trim());
                    refrigerator.change_temp(newTemperature);
                    System.out.println("Temperature changed to: " + newTemperature + "°C");
                } catch (NumberFormatException e) {
                    System.out.println("Invalid input. Please enter a valid integer for the temperature.");
                }
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlGarageDoor(Scanner scanner, GarageDoor garageDoor) {
        System.out.println("\n--- Garage Door ---");
        System.out.println("1. Open Door");
        System.out.println("2. Close Door");
        System.out.println("3. Schedule Opening");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                garageDoor.openDoor();
                break;
            case 2:
                garageDoor.closeDoor();
                break;
            case 3:
                System.out.print("Enter hour (0-23): ");
                int hour = Integer.parseInt(scanner.nextLine());
                System.out.print("Enter minute (0-59): ");
                int minute = Integer.parseInt(scanner.nextLine());
                garageDoor.scheduleOpening(hour, minute);
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlEnergyMonitor(Scanner scanner, EnergyMonitor energyMonitor) {
        System.out.println("\n--- Energy Monitor ---");
        System.out.println("1. Turn On");
        System.out.println("2. Turn Off");
        System.out.println("3. Enable Power Saving Mode");
        System.out.println("4. Disable Power Saving Mode");
        System.out.print("Select an action (1-4): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                energyMonitor.turnOn();
                break;
            case 2:
                energyMonitor.turnOff();
                break;
            case 3:
                energyMonitor.enablePowerSavingMode();
                break;
            case 4:
                energyMonitor.disablePowerSavingMode();
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlMusicSystem(Scanner scanner, MusicSystem musicSystem) {
        System.out.println("\n--- Music System ---");
        System.out.println("1. Play");
        System.out.println("2. Pause");
        System.out.println("3. Next Track");
        System.out.println("4. Previous Track");
        System.out.print("Select an action (1-4): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                musicSystem.play();
                break;
            case 2:
                musicSystem.pause();
                break;
            case 3:
                musicSystem.nextTrack();
                break;
            case 4:
                musicSystem.previousTrack();
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlSmartVacuum(Scanner scanner, SmartVacuum smartVacuum) {
        System.out.println("\n--- Smart Vacuum ---");
        System.out.println("1. Start Cleaning");
        System.out.println("2. Stop Cleaning");
        System.out.println("3. Check Battery Status");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                smartVacuum.startCleaning();
                smartVacuum.notifyUser();
                break;
            case 2:
                smartVacuum.stopCleaning();
                smartVacuum.notifyUser();
                break;
            case 3:
                int batteryStatus = smartVacuum.getBatteryStatus();
                System.out.println("Current Battery Status: " + batteryStatus + "%");
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlAC(Scanner scanner, AirConditioning AC) {
        System.out.println("\n--- Air Conditioning ---");
        System.out.println("1. Turn On");
        System.out.println("2. Turn Off");
        System.out.println("3. Set the temperature");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                AC.turnOn();
                break;
            case 2:
                AC.turnOff();
                break;
            case 3:
                System.out.println("enter the temperature of the A.C.");
                float t = Float.parseFloat(scanner.nextLine());
                AC.setTemperature(t);
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlCurtains(Scanner scanner, CurtainsControl curtains) {
        System.out.println("\n--- Curtains Control---");
        System.out.println("1. Close Curtains");
        System.out.println("2. Open Curtains");
        System.out.print("Select an action (1-2): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                curtains.close();
                break;
            case 2:
                curtains.open();
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlDoor(Scanner scanner, DoorLock door) {
        System.out.println("\n--- Door lock System---");
        System.out.println("1. lock the door");
        System.out.println("2. unlock the door");
        System.out.println("3. is the door Locked?");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());

        switch (action) {
            case 1:
                door.lockDoor();
                break;
            case 2:
                door.unlockDoor();
                break;
            case 3:
                door.isLocked();
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlHeater(Scanner scanner, HeatingSystem heater) {
        System.out.println("\n--- Heating System---");
        System.out.println("1. on the heater");
        System.out.println("2. off the heater");
        System.out.println("3. set the temperature");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());
        float temp;

        switch (action) {
            case 1:
                heater.turnOn();
                break;
            case 2:
                heater.turnOff();
                break;
            case 3:
                System.out.printf("enter the temperature you want to set on the heater: ");
                temp = Float.parseFloat(scanner.nextLine());
                heater.setTemperature(temp);
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlLights(Scanner scanner, LightsControl lights) {
        System.out.println("\n---Light control System---");
        System.out.println("1. on the Lights");
        System.out.println("2. off the lights");
        System.out.println("3. set the color of the light");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());
        String color;

        switch (action) {
            case 1:
                lights.turnOn();
                break;
            case 2:
                lights.turnOff();
                break;
            case 3:
                System.out.println("enter the Color of the light: ");
                color = scanner.nextLine();
                lights.setColor(color);
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlSecurity(Scanner scanner, SecuritySystem camera) {
        System.out.println("\n---Security control System---");
        System.out.println("1. on the Security camera");
        System.out.println("2. off the Security camera");
        System.out.println("3. is the security camera on?");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());
        switch (action) {
            case 1:
                camera.turnOn();
                break;
            case 2:
                camera.turnOff();
                break;
            case 3:
                camera.isCameraOn();
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static void controlWaterSprinkler(Scanner scanner, WaterSprinkler sprinkler) {
        System.out.println("\n---Water sprinkler System---");
        System.out.println("1. Turn on the Water sprinkler");
        System.out.println("2. Turn off the Water sprinkler");
        System.out.println("3. Set timer for water sprinkler");
        System.out.print("Select an action (1-3): ");

        int action = Integer.parseInt(scanner.nextLine());
        int min;
        switch (action) {
            case 1:
                sprinkler.turnOn();
                break;
            case 2:
                sprinkler.turnOff();
                break;
            case 3:
                System.out.println("enter the minutes to schedule the water sprinkler: ");
                min = Integer.parseInt(scanner.nextLine());
                sprinkler.setschedule(min);
                break;
            default:
                System.out.println("Invalid action.");
        }
    }

    private static boolean continueDevice(Scanner scanner) {
        System.out.print("Do you want to continue making changes to this device? (y/n): ");
        String continueWithDevice = scanner.nextLine().toLowerCase();
        return continueWithDevice.equals("y");
    }

    private static boolean continueAnotherDevice(Scanner scanner) {
        System.out.print("Do you want to control another device? (y/n): ");
        String continueWithAnotherDevice = scanner.nextLine().toLowerCase();
        return continueWithAnotherDevice.equals("y");
    }

}
