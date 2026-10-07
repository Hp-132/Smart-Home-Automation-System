# Smart Home Automation System

A Java smart-home simulator that started as a menu-driven console application and was later extended with an interactive, 3D-style (isometric) web interface. You can walk through a cutaway house, click lights, curtains and appliances, and every action is handled by the original Java device classes on the backend.

## Project evolution

**Version 1: Java console app.** The project began as a plain Java application, `smarthome.SmartHomeController`. It models 14 home devices as Java classes (lights, curtains, AC, heater, TV, music system, fridge, robot vacuum, garage door, door lock, security camera, energy monitor, water sprinkler and a smoke detector) and controls them through a text-based menu. This console version still works.

**Version 2: Interactive 3D-style web UI.** The same device classes now sit behind a lightweight Java HTTP server with a REST API. A browser front end draws the house in an isometric 3D view, so you control devices by clicking them in the room where they are, rather than picking menu options.

## Features

- **Isometric house** with a living room, kitchen, garage, bedroom, bathroom and garden. Click a room to zoom in; each device gets a pin.
- **Lights.** Toggle, change colour and adjust brightness. The room lights up and takes on the light's tint.
- **Curtains.** Animated open and close, with daylight falling on the floor when open.
- **Appliances.** TV (channel, volume), AC and heater (temperature), music (play, pause, track), robot vacuum (moves while cleaning), fridge, garage door, door lock, security camera (view cone), sprinkler (timer), energy monitor and smoke detector.
- **Routines.** All lights off, Night mode and Away mode.
- **Dashboard** showing device count, devices switched on and security status.
- **Live feedback.** Pending states, error messages, an offline banner and "Not responding" indicators.
- Light and dark themes, a Day/Evening scene switch, mobile-friendly layout and reduced-motion support.

## Tech stack

| Layer | Technology |
|---|---|
| Core logic | Java 17, object-oriented device classes, `Device` interface |
| Backend | JDK built-in `com.sun.net.httpserver.HttpServer`, REST/JSON API (no external libraries) |
| Frontend | HTML5, CSS3, vanilla JavaScript (ES modules) |
| 3D-style rendering | SVG with a custom isometric projection |
| Deployment | Docker (multi-stage build, Eclipse Temurin JDK/JRE 17) |

No frameworks or third-party dependencies are needed.

## Project structure

```
smarthome/
├── Device.java                 # common device interface
├── SmartHomeController.java    # original console app
├── devices/                    # device classes (lights, AC, TV, ...)
├── sensors/                    # SmokeDetector
└── web/
    ├── SmartHomeServer.java    # HTTP server + REST API
    ├── DeviceRegistry.java     # devices per room
    ├── DeviceAdapter(s).java   # maps web commands to device methods
    ├── Routines.java           # multi-device routines
    ├── Json.java               # small JSON parser/writer
    └── static/                 # index.html, css, js (house, iso, app, api)
```

## Running locally

Requires JDK 17 or newer.

| | Windows | macOS / Linux |
|---|---|---|
| Build | `build.bat` | `./build.sh` |
| Start web UI | `run.bat` | `./run.sh` |
| Console app | `java -cp out smarthome.SmartHomeController` | same |

Then open http://localhost:8080.

- Pass a different port as the first argument (`./run.sh 9000`) or set the `PORT` environment variable.
- The server binds to `127.0.0.1` by default. Use `-Dsmarthome.host=0.0.0.0` to reach it from other devices on your network.

## Running with Docker

```bash
docker build -t smarthome .
docker run -p 8080:8080 smarthome
```

The container reads the `PORT` environment variable, so it can be deployed as-is on Render, Railway, Fly.io or any Docker host.

## REST API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/home` | Rooms, devices (state and capabilities), routines |
| GET | `/api/devices`, `/api/devices/{id}` | Device state |
| POST | `/api/devices/{id}/commands` | e.g. `{"action":"turnOn"}` or `{"action":"setTemperature","value":22}` |
| GET / POST | `/api/routines`, `/api/routines/{id}/run` | `all-lights-off`, `night`, `away` |
| GET | `/api/activity` | Last 40 commands with device messages |

Errors return JSON `{"ok":false,"error":"..."}` with status 400, 404, 405 or 503.

## Limitations

- All devices are software simulations; no physical hardware is controlled.
- State is held in memory and resets when the server restarts.
- There is no authentication, so add some before exposing the server publicly.

## Author

**Hensi Patel**, B.Tech CSE, Nirma University
[LinkedIn](https://www.linkedin.com/in/hensi-patel-4111b3286/)
