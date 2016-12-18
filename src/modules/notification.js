class Notification{
  constructor(name){
    var type = Notification.mapFileNameToType(name);
    if(type){
      var notification = Notification.buildNotification(type);
      this.type = notification.type;
      this.bubble = notification.bubble;
      this.aquisition = notification.aquisition;
      this.fill = notification.fill;
    }
  }

  static mapFileNameToType(filename){
    var map = {
      "waypoint-masked": "wpm",
      "danger-3": "wps",
      "waypoint-safety": "wps",
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
          acquisition: 20,
      },
      wps: {
          type: "wps",
          fill: '#ff4200',
          bubble: 200,
          acquisition: 20,
      },
      dss: {
          type: "dss",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
      ass: {
          type: "ass",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
      dsz: {
          type: "dsz",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
      fsz: {
          type: "fsz",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
    }
    return types[type];
  }

  static nameMatchesClass(name,type){
    console.log(name);
    console.log(type);
    return (this.mapFileNameToType(name) == type);
  }
}
