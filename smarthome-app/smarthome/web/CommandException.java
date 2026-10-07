package smarthome.web;

/** A device command that could not be carried out. The HTTP status tells the client why. */
public class CommandException extends Exception {
    private final int status;

    public CommandException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }

    public static CommandException badRequest(String message) {
        return new CommandException(400, message);
    }
}
