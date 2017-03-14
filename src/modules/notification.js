'use strict';
/*
  This class provides a structured data format to store
  and modify notifications which can be exported via GPX
  for use in RallyBlitz and RallyComp.

  Any other parties interested in integrating should also be accomodated.

  // NOTE this is a straight up model and the simplicity of such is beautiful
  // NOTE Buuuuut there are two static calls in the constructor, maybe look at the factory patter
*/
class Notification{
  constructor(name){
    var type = Notification.mapFileNameToType(name);
    if(type){
      var notification = Notification.buildNotification(type);
      this.type = notification.type;
      this.bubble = notification.bubble;
      this.modifier = notification.modifier;
      this.modMin = notification.modMin;
      this.modMax = notification.modMax;
      this.modStep = notification.modStep;
      this.fill = notification.fill;
    }
  }

  static mapFileNameToType(filename){
    var map = {
      "waypoint-masked": "wpm",
      "waypoint-eclipsed": "wpe",
      "danger-3": "wps",
      "waypoint-safety": "wps",
      "start": "dss",
      "start-of-selective-section": "dss",
      "finish": "fss",
      "finish-of-selective-section": "fss",
      "speed-start": "dsz",
      "speed-end": "fsz",
    }
    return map[filename];
  }


  static buildNotification(type){
    var types = {
      wpm: {
          type: "wpm",
          fill: '#008CBA',
          bubble: 400,
          modifier: 400,
          modMin: 100,
          modMax: 800,
          modStep: 100,
      },
      wpe: {
          type: "wpe",
          fill: '#008CBA',
          bubble: 50,
      },
      wps: {
          type: "wps",
          fill: '#ff4200',
          bubble: 200,
          modifier: 200,
          modMin: 10,
          modMax: 400,
          modStep: 10,
      },
      dss: {
          type: "dss",
          fill: '#ffba29',
          bubble: 50,
      },
      fss: {
          type: "fss",
          fill: '#ffba29',
          bubble: 50,
      },
      dsz: {
          type: "dsz",
          fill: '#ffba29',
          bubble: 200,
          modifier: 5,
          modMin: 5,
          modMax: 200,
          modStep: 5,
      },
      fsz: {
          type: "fsz",
          fill: '#ffba29',
          bubble: 50,
      },
    }
    return types[type];
  }

  static nameMatchesClass(name,type){
    return (Notification.mapFileNameToType(name) == type);
  }
}

/*
  Node exports for test suite
*/
module.exports.nameMatchesClass = Notification.nameMatchesClass;
module.exports.mapFileNameToType = Notification.mapFileNameToType;
module.exports.buildNotification = Notification.buildNotification;
