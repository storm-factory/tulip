var Roadbook = Class({
  create: function(opts){
    riot.observable(this);
    this.waypoints = [];
  },

  addWaypoint: function(wptData){
    wptData.id = this.waypoints.length + 1;
    var waypoint = new Waypoint(wptData);
    this.waypoints.push(waypoint); //TODO figure out how to add waypoints to the middle of the roadbook in between other waypoints
    this.renderWaypoints();
  },

  deleteWaypoint: function(wptId){
    this.waypoints.splice(wptId - 1,1);
    this.reindexWaypoints();
    this.renderWaypoints();
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
