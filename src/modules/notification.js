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
    types.wpm = {
        class: "wpm",
        fill: '#008CBA',
        bubble: 400,
        acquisition: 20,
    }

    types.wps = {
        class: "wps",
        fill: '#ff4200',
        bubble: 150,
        acquisition: 20,
    }

    types.speed = {
        class: "speed",
        fill: '#ffba29',
        bubble: 200,
        acquisition: 20,
    }

    return types[type]
  }
}
