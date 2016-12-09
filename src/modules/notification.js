class Notification{
  constructor(type){
    var type = this.buildNotification(type);
    this.class = type.class
    this.bubble = type.bubble;
    this.aquisition = type.aquisition
    this.fill = type.fill
  }

  buildNotification(type){
    var types = {};
    types.rallyBlitzWPM = {
        class: "wpm",
        fill: '#008CBA',
        bubble: 400,
        aquisition: 20,
    }

    types.rallyBlitzSafety = {
        class: "safety",
        fill: '#ff4200',
        bubble: 150,
        aquisition: 20,
    }

    types.rallyBlitzSpeed = {
        class: "speed",
        fill: '#ffba29',
        bubble: 200,
        aquisition: 20,
    }

    return types[type]
  }
}
