var Roadbook = Class({
  create: function(opts){
    this.waypoints = ko.observableArray([]);

    /*
      declare some state instance variables
    */
    // this.drawRoute = false; // I don' think this is being used
    this.currentlyEditingCanvas = false;
    this.currentlyEditingCanvasObject = null;
    this.newWaypoints = false;
  },

  /*
    ---------------------------------------------------------------------------
      Waypoint management
    ---------------------------------------------------------------------------
  */

  addWaypoint: function(wptData){

    //determine index of waypoint based on distance from start
    var index = this.determineWaypointInsertionIndex(wptData.distances.kmFromStart);
    var waypoint = new Waypoint(this, wptData);

    this.waypoints.splice(index,0,waypoint);
    this.reindexWaypoints();

    //persistence tracking
    this.newWaypoints = true;
    $('#save-roadbook').removeClass('secondary');

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
    ---------------------------------------------------------------------------
      Roadbook edit control flow
    ---------------------------------------------------------------------------
  */

  // Keeps track of which waypoint canvas is being edited so there aren't too many UI controls all at once
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

  // Removes all the edit UI from the roadbook waypoints
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

  /*
    ---------------------------------------------------------------------------
      Roadbook persistence
    ---------------------------------------------------------------------------
  */

  save:  function(){
    var roadbookJSON = {
      waypoints: [],
    }
    // this sort of works but in reality we need all the points from the mapEditor object, and if it is a waypoint we need that as well.
    // for now building this persistence object at the roadbook level makes sense though
    ko.utils.arrayForEach(this.waypoints(), function(waypoint) {
        var waypointJSON = {
          lat: "placeholder to get from mapping",
          long: "placeholder to get from mapping",
          tulipJson: "placeholder to get from waypoint",
          kmFromStart: waypoint.kmFromStart(),
          kmFromPrev: waypoint.kmFromPrev(),
          heading: waypoint.heading()
        }

        roadbookJSON.waypoints.push(waypointJSON);
    });
    console.log(app.)
    console.log(roadbookJSON);
  },

});
