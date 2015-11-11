var Roadbook = Class({
  create: function(opts){
    riot.observable(this);
    this.waypoints = [];
  },

  addWaypoint: function(wptData){

    console.log(wptData);
    //determine index of waypoint based on distance from start
    var index = this.determineWaypointInsertionIndex(wptData.kmFromStart);
    var waypoint = new Waypoint(wptData);
    waypoint.id = index;
    // if(this.waypoints.length == 0) {
    //
    // } else {
    //
    // }

    this.waypoints.splice(Math.abs(index),0,waypoint);
    this.renderWaypoints();
  },

  deleteWaypoint: function(wptId){
    this.waypoints.splice(wptId - 1,1);
    this.reindexWaypoints();
    this.renderWaypoints();
  },

  /*
    Use a binary search algorithm to determine the index to insert the waypoing into the roadbook
    waypoints array
  */
  determineWaypointInsertionIndex: function(kmFromStart){
    var minIndex = 0;
    var maxIndex = this.waypoints.length - 1;
    var currentIndex;
    var midpoint = this.waypoints.length/2 | 0;
    var currentElement;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = this.waypoints[currentIndex];

      if (currentElement.kmFromStart < kmFromStart) {
        minIndex = currentIndex + 1;
      }
      else if (currentElement.kmFromStart > kmFromStart) {
        maxIndex = currentIndex - 1;
      }
      else {
        return currentIndex;
      }
    }
    return ~maxIndex;
  },

  reindexWaypoints: function(){
    for(i = 0; i < this.waypoints.length; i++){
      waypoint = this.waypoints[i];
      waypoint.id = i + 1; //we don't need no zero index
    }
  },

  renderWaypoints: function(){
    riot.mount('waypoint', {waypoints: this.waypoints});
  }
});
