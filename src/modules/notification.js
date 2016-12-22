/*
  This class provides a structured data format to store
  and modify notifications which can be exported via GPX
  for use in RallyBlitz and RallyComp.

  Any other parties interested in integrating should also be accomodated.
*/
class Notification{
  constructor(name){
    var type = Notification.mapFileNameToType(name);
    if(type){
      var notification = Notification.buildNotification(type);
      this.type = notification.type;
      this.bubble = notification.bubble;
      this.modifier = notification.modifier;
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
      },
      dss: {
          type: "dss",
          fill: '#ffba29',
          bubble: 50,
      },
      fss: {
          type: "ass",
          fill: '#ffba29',
          bubble: 50,
      },
      dsz: {
          type: "dsz",
          fill: '#ffba29',
          bubble: 200,
          modifier: 0,
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
    return (this.mapFileNameToType(name) == type);
  }
}
