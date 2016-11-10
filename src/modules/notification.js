class Notification{
  constructor(type){
    this.types = {};
    this.initTypes();
    var type = this.types[type];
    this.bubble = type.bubble;
    this.aquisition = type.aquisition
  }

  initTypes(){

    this.types.rallyBlitzWPM = {
        bubble: 400,
        aquisition: 20,
    }

    this.types.rallyBlitzSafety = {
        bubble: 150,
        aquisition: 20,
    }

    this.types.rallyBlitzSpeed = {
        bubble: 200,
        aquisition: 20,
    }
  }
}
