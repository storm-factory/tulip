class Notification{
  constructor(type){
    this.types = {};
    this.initTypes();
    var type = this.types[type];
    this.class = type.class
    this.bubble = type.bubble;
    this.aquisition = type.aquisition
    this.fill = type.fill
  }

  initTypes(){

    this.types.rallyBlitzWPM = {
        class: "wpm",
        fill: '#008CBA',
        bubble: 400,
        aquisition: 20,
    }

    this.types.rallyBlitzSafety = {
        class: "safety",
        fill: '#ff4200',
        bubble: 150,
        aquisition: 20,
    }

    this.types.rallyBlitzSpeed = {
        class: "speed",
        fill: '#ffba29',
        bubble: 200,
        aquisition: 20,
    }
  }
}
