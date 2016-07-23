'use strict';

const net = require('net');
const crypto = require('crypto');

var Service, Characteristic;

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-real-fake-garage-doors', 'RealFakeGarageDoors', RealFakeGarageDoorsAccessory);
};

class RealFakeGarageDoorsAccessory {
  constructor (log, config) {
    this.log = log;

    this.host = config['host'];
    this.port = config['port'];
    this.key = config['key'];

    this.openCommand = config['openCommand'];
    this.closeAfter = config['closeAfter'];
    this.lastOpened = new Date();

    this.simulateTimeOpening = config['simulateTimeOpening'];
    this.simulateTimeOpen = config['simulateTimeOpen'];
    this.simulateTimeClosing = config['simulateTimeClosing'];

    this.service = new Service.GarageDoorOpener(config['name'], config['name']);
    this.setupGarageDoorOpenerService(this.service);

    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Plumbus & Kimble Inc.')
      .setCharacteristic(Characteristic.Model, 'Interdimensional Remote')
      .setCharacteristic(Characteristic.SerialNumber, 'C-137');
  }

  getServices () {
    return [this.informationService, this.service];
  }

  setupGarageDoorOpenerService (service) {
    this.service.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED);
    this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);

    service.getCharacteristic(Characteristic.TargetDoorState)
      .on('get', (callback) => {
        var tds = service.getCharacteristic(Characteristic.TargetDoorState).value;
        if (tds === Characteristic.TargetDoorState.OPEN &&
          (((new Date()) - this.lastOpened) >= (this.closeAfter * 1000))) {
          this.log('Setting TargetDoorState to CLOSED');
          callback(null, Characteristic.TargetDoorState.CLOSED);
        } else {
          callback(null, tds);
        }
      })
      .on('set', (value, callback) => {
        if (value === Characteristic.TargetDoorState.OPEN) {
          this.lastOpened = new Date();
          switch (service.getCharacteristic(Characteristic.CurrentDoorState).value) {
            case Characteristic.CurrentDoorState.CLOSED:
            case Characteristic.CurrentDoorState.CLOSING:
            case Characteristic.CurrentDoorState.OPEN:
              this.openDoor(callback);
              break;
            default:
              callback();
          }
        } else {
          callback();
        }
      });
  }

  openDoor (callback) {
    var client = this.sendCommand(this.openCommand);
    var callbackCalled = false;

    client.on('data', (data) => {
      client.end();
      var dataString = data.toString('ascii');
      if (+dataString === +this.openCommand) {
        this.log('Opening door!');
        this.simulateDoorOpening();
        callbackCalled = true;
        callback();
      } else {
        this.log('Could not open door! Response: %s', data);
        callbackCalled = true;
        callback(new Error('Could not open door! Response: ' + data));
      }
    });
    client.on('error', (err) => {
      if (!callbackCalled) {
        callback(err);
      }
    });
  }

  sendCommand (command) {
    const hmac = crypto.createHmac('sha256', this.key);
    var client = new net.Socket();
    client.connect(this.port, this.host, () => {
      var epochTime = Math.floor((new Date()).getTime() / 1000);
      hmac.update(epochTime + '', 'ascii');
      client.write(hmac.digest());
      client.write(new Buffer([command]));
    });
    client.on('error', (err) => {
      client.end();
      this.log(err);
    });
    return client;
  }

  simulateDoorOpening () {
    this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
    setTimeout(() => {
      this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
      setTimeout(() => {
        this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
        this.service.setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED);
        setTimeout(() => {
          this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
        }, this.simulateTimeClosing * 1000);
      }, this.simulateTimeOpen * 1000);
    }, this.simulateTimeOpening * 1000);
  }
}
