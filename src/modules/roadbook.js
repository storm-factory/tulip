var Roadbook = Class({
  create: function(opts){
    this.waypoints = ko.observableArray([]);

    /*
      declare some state instance variables
    */
    this.drawRoute = false;
    this.currentlyEditingCanvas = false; //Change to be a canvas object specific variable
    this.currentlyEditingCanvasObject = null; //Change to be a canvas object specific variable
  },

  addWaypoint: function(wptData){

    //determine index of waypoint based on distance from start
    var index = this.determineWaypointInsertionIndex(wptData.distances.kmFromStart);
    var waypoint = new Waypoint(this, wptData);

    this.waypoints.splice(index,0,waypoint);
    this.reindexWaypoints();

    return waypoint;
  },

  deleteWaypoint: function(wptId){
    this.waypoints.splice(wptId - 1,1);
    this.reindexWaypoints();
  },

  /*
    Use a binary search algorithm to determine the index to insert the waypoint into the roadbook
    waypoints array
  */
  determineWaypointInsertionIndex: function(kmFromStart){
    var minIndex = 0;

    var maxIndex = this.waypoints().length - 1;
    var currentIndex;
    var midpoint = this.waypoints().length/2 | 0;
    var currentElement;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = this.waypoints()[currentIndex];

      if (currentElement.kmFromStart() < kmFromStart) {
        minIndex = currentIndex + 1;
      }
      else if (currentElement.kmFromStart() > kmFromStart) {
        maxIndex = currentIndex - 1;
      }
      else {
        return currentIndex;
      }
    }
    return Math.abs(~maxIndex);
  },

  reindexWaypoints: function(){
    for(i = 0; i < this.waypoints().length; i++){
      waypoint = this.waypoints()[i];
      waypoint.id = i + 1; //we don't need no zero index
    }
  },

  /*
    Roadbook edit control flow
  */

  //TODO Change to request canvas edit
  //TODO Move this into the roadbook module
  requestCanvasEdit: function(object){
    if(object != this.currentlyEditingCanvasObject){
      if(this.currentlyEditingCanvasObject){
        this.currentlyEditingCanvasObject.finishEdit();
      }
      this.currentlyEditingCanvasObject = object;
      this.currentlyEditingCanvas = true;
      $('#save-roadbook').removeClass('secondary');
      return true;
    }
  },

  //TODO Change to finish canvas edit
  //TODO Move this into the roadbook module
  finishCanvasEdit: function(){
    if(this.currentlyEditingCanvas){
      this.currentlyEditingCanvas = false;

      for(i = 0; i < this.waypoints().length; i++){
        this.currentlyEditingCanvasObject.finishEdit();
        this.currentlyEditingCanvasObject = null;
      }

      return true;
    }
  },

});
