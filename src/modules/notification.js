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
      "start-of-selective-section": "dss",
      "finish-of-selective-section": "ass",
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
          bubble: 400,
          modifier: 400,
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
          bubble: 200,
      },
      ass: {
          type: "ass",
          fill: '#ffba29',
          bubble: 200,
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
          bubble: 200,
      },
    }
    return types[type];
  }

  static nameMatchesClass(name,type){
    return (this.mapFileNameToType(name) == type);
  }
}
