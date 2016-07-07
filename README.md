# homebridge-real-fake-garage-doors
[![NPM Version](https://img.shields.io/npm/v/homebridge-real-fake-garage-doors.svg)](https://www.npmjs.com/package/homebridge-real-fake-garage-doors)

Garage Door Opener plugin for [Homebridge](https://github.com/nfarina/homebridge).

This is the Homebridge portion of my Real Fake Garage Doors project.
The hardware portion of this project is [RealFakeGarageDoors](https://github.com/plasticrake/RealFakeGarageDoors).

I opened a [Linear Multi-Code 412001](https://www.amazon.com/dp/B000F5KEP6/) garage door remote and attached an ESP8266 to trigger it to open the garage door. Since the ESP8266 doesn't have an easy way to encrypt traffic as a server I'm using SHA256-HMAC to send authenticated commands to the ESP8266.



## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-real-fake-garage-doors`
3. Update your configuration file. See the sample below.

## Updating

- `npm update -g homebridge-real-fake-garage-doors`

## Configuration

`key`: SHA256-HMAC key that should match the key on the receiving microcontroller.

`openCommand`: Command to send to open the door.

`closeAfter`: (seconds) Set TargetDoorState to CLOSED after this many seconds.

`simulateTimeOpening` / `simulateTimeOpen` / `simulateTimeClosing`: (seconds)  Since our controller is "dumb" we have no way of knowing the actual state of the door. So when we trigger the open command we simulate by changing the door CurrentDoorState to OPENING, OPEN, CLOSING, and CLOSED.


### Sample Configuration

```json
"accessories": [{
  "accessory": "RealFakeGarageDoorsAccessory",
  "name": "My Real Fake Garage Door",

  "host": "localhost",
  "port": 3893,

  "key": "wubbalubbadubdub",
  "openCommand": 2,
  "closeAfter": 28,
  "simulateTimeOpening": 13,
  "simulateTimeOpen": 15,
  "simulateTimeClosing": 12
}]
```
