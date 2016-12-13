class Notification{
  constructor(type){
    var type = this.buildNotification(type);
    this.class = type.class
    this.bubble = type.bubble;
    this.aquisition = type.aquisition
    this.fill = type.fill
  }

  buildNotification(type){
    var types = {
      wpm: {
          class: "wpm",
          fill: '#008CBA',
          bubble: 400,
          acquisition: 20,
      },
      wps: {
          class: "wps",
          fill: '#ff4200',
          bubble: 200,
          acquisition: 20,
      },
      dss: {
          class: "dss",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
      ass: {
          class: "ass",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
      dsz: {
          class: "dsz",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
      fsz: {
          class: "fsz",
          fill: '#ffba29',
          bubble: 200,
          acquisition: 20,
      },
    }
    return types[type]
  }
}
