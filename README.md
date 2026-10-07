# 🏠 Smart Home Automation System

A Java smart-home simulator that controls 21 virtual devices across 6 rooms. It started as a **menu-driven Java console app** and was later extended into an **interactive 3D-style (isometric) web interface**, where you control devices by clicking them inside the house.

---

## Project Evolution

| Stage | Description |
|---|---|
| **v1: Console app** | Plain Java (`SmartHomeController`) with object-oriented device classes and a shared `Device` interface. You control devices through a text menu. |
| **v2: Interactive web UI** | The same Java device classes run behind a REST API, and the browser shows a cutaway isometric house. Clicking a light, curtain or appliance calls the Java backend, and the house updates to show the new state. |

---

## Rooms & Devices

| Room | Devices |
|---|---|
| Living room | Pendant light, Curtains, TV, Music system, Air conditioner, Robot vacuum |
| Kitchen | Island pendant light, Refrigerator, Smoke detector |
| Garage | Garage light, Garage door, Energy monitor |
| Bedroom | Bedroom light, Curtains, Air conditioner |
| Bathroom | Bathroom light, Heater |
| Garden & entry | Garden lamp, Front door lock, Security camera, Water sprinkler |

---

## Device Controls

| Device | Controls | Range / Notes |
|---|---|---|
| 💡 **Lights** | On / Off, Colour, Brightness | Brightness 1–100%; the room glows in the light's colour |
| 🪟 **Curtains** | Open / Close | Animated; open curtains let daylight into the room |
| 📺 **TV** | On / Off, Channel, Volume | Channel 1–500, Volume 0–100 |
| 🎵 **Music system** | Play, Pause, Next, Previous track | |
| ❄️ **Air conditioner** | On / Off, Temperature | 20–31 °C |
| 🔥 **Heater** | On / Off, Temperature | 20–35 °C |
| 🧊 **Refrigerator** | On / Off, Temperature | −5–7 °C; warns above 5 °C |
| 🤖 **Robot vacuum** | Start / Stop cleaning | Moves around the room while cleaning |
| 🚨 **Smoke detector** | Arm / Disarm, Test alarm, Silence, Self-diagnostic | |
| 🚗 **Garage door** | Open / Close, Schedule opening | Door rolls up; schedule set as hour and minute |
| ⚡ **Energy monitor** | On / Off, Power-saving mode | |
| 🔒 **Front door lock** | Lock / Unlock | |
| 📷 **Security camera** | On / Off | Shows a view cone when active |
| 💧 **Water sprinkler** | On / Off, Timer | 1–120 minutes |

---

## Routines

| Routine | What it does |
|---|---|
| **All lights off** | Switches off every light in the house |
| **Night mode** | Turns lights off, closes curtains, turns TV and music off, locks the front door, closes the garage, and turns the camera and smoke detector on |
| **Away mode** | Turns lights, AC, heater, TV, music and sprinkler off, locks the front door, closes the garage, and turns the camera on |

---

## How to Use the UI

- **Click a room** on the house, or in the sidebar, to zoom in. Each device gets a pin.
- **Click a device** in the house to toggle it, or use its panel for detailed controls.
- The **dashboard** shows the total number of devices, how many are on, and security status (door, garage, camera).
- Use **Day / Evening** to switch the scene, and the theme button for **Light / Dark** mode.
- The UI shows a loading state while a command is processed, an **offline banner** if the server is down, and **"Not responding"** for unavailable devices.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Core logic | Java 17, OOP device classes, `Device` interface |
| Backend | JDK built-in `HttpServer`, REST / JSON API, no external libraries |
| Frontend | HTML5, CSS3, vanilla JavaScript (ES modules) |
| 3D-style view | SVG with custom isometric projection |
| Hosting | Render, built from the included `Dockerfile` |




## Project Structure

```
smarthome/
├── SmartHomeController.java   # v1 console app
├── Device.java                # device interface
├── devices/                   # light, AC, TV, fridge, lock, ...
├── sensors/                   # smoke detector
└── web/
    ├── SmartHomeServer.java   # HTTP server + REST API
    ├── DeviceRegistry.java    # rooms and devices
    ├── DeviceAdapters.java    # web command → device method
    ├── Routines.java
    └── static/                # HTML, CSS, JS (isometric house)
`

