'use strict';
/*
  This class provides a structured data format to store
  and modify notifications which can be exported via GPX
  for use in RallyBlitz and RallyComp.

  Any other parties interested in integrating should also be accomodated.

  // NOTE this is a straight up model and the simplicity of such is beautiful
  // NOTE Buuuuut there are two static calls in the constructor, maybe look at the factory pattern
*/
class Notification{
  constructor(name){
    var type = Notification.mapFileNameToType(name);
    if(type){
      var notification = Notification.buildNotification(type);
      this.type = notification.type;
      this.openrallytype = notification.openrallytype;
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
      "speed-20": "speed-20",
      "speed-25": "speed-25",
      "speed-30": "speed-30",
      "speed-35": "speed-35",
      "speed-40": "speed-40",
      "speed-45": "speed-45",
      "speed-50": "speed-50",
      "speed-55": "speed-55",
      "speed-60": "speed-60",
      "speed-65": "speed-65",
      "speed-70": "speed-70",
      "speed-75": "speed-75",
      "speed-80": "speed-80",
      "speed-85": "speed-85",
      "speed-90": "speed-90",
      "speed-95": "speed-95",
      "speed-100": "speed-100",
      "speed-105": "speed-105",
      "speed-110": "speed-110",
      "speed-120": "speed-120",
    }
    return map[filename];
  }


  static buildNotification(type){
    var types = {
      "speed-20": {
        type: "speed-20",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 20,
      },
      "speed-25": {
        type: "speed-25",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 25,
      },
      "speed-30": {
        type: "speed-30",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 30,
      },
      "speed-35": {
        type: "speed-35",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 35,
      },
      "speed-40": {
        type: "speed-40",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 40,
      },
      "speed-45": {
        type: "speed-45",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 45,
      },
      "speed-50": {
        type: "speed-50",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 50,
      },
      "speed-55": {
        type: "speed-55",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 55,
      },
      "speed-60": {
        type: "speed-60",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 60,
      },
      "speed-65": {
        type: "speed-65",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 65,
      },
      "speed-70": {
        type: "speed-70",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 70,
      },
      "speed-75": {
        type: "speed-75",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 75,
      },
      "speed-80": {
        type: "speed-80",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 80,
      },
      "speed-85": {
        type: "speed-85",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 85,
      },
      "speed-90": {
        type: "speed-90",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 90,
      },
      "speed-95": {
        type: "speed-95",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 95,
      },
      "speed-100": {
        type: "speed-100",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 100,
      },
      "speed-105": {
        type: "speed-105",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 105,
      },
      "speed-110": {
        type: "speed-110",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 110,
      },
      "speed-120": {
        type: "speed-120",
        openrallytype: "speed",
        fill: '#008CBA',
        modifier: 120,
      },
      wpm: {
          type: "wpm",
		      openrallytype: "wpm",
          fill: '#008CBA',
          bubble: 400,
          modifier: 400,
          modMin: 100,
          modMax: 800,
          modStep: 100,
      },
      wpe: {
          type: "wpe",
		      openrallytype: "wpe",
          fill: '#008CBA',
          bubble: 50,
      },
      wps: {
          type: "wps",
          openrallytype: "wps",
          fill: '#ff4200',
          bubble: 200,
          modifier: 200,
          modMin: 10,
          modMax: 400,
          modStep: 10,
      },
      dss: {
          type: "dss",
          openrallytype: "dss",
          fill: '#ffba29',
          bubble: 50,
      },
      fss: {
          type: "fss",
          openrallytype: "ass",
          fill: '#ffba29',
          bubble: 50,
      },
      dsz: {
          type: "dsz",
          openrallytype: "dz",
          fill: '#ffba29',
          bubble: 200,
          modifier: 5,
          modMin: 5,
          modMax: 200,
          modStep: 5,
      },
      fsz: {
          type: "fsz",
          openrallytype: "fz",
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
