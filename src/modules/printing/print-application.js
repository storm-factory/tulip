/*
  ---------------------------------------------------------------------------
  Define the print application object as a singleton

  This class is the main IO interface between the user an the printing application


  ---------------------------------------------------------------------------
*/
var PrintApp = Class({
  singleton: true,
  create: function(){
    var _this = this;
    this.name = ko.observable('');
    this.desc = ko.observable('');
    this.totalDistance = ko.observable('');
    this.waypoints = ko.observableArray([]);
    window.addEventListener('message', function(e) {
      _this.parseJson(e.data);
    });
    window.opener.postMessage({ready: true});
  },

  parseJson: function(json){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.waypoints(json.waypoints);
    ko.applyBindings(this);
  }
});

/*
  ---------------------------------------------------------------------------
  Instantiate the application
  ---------------------------------------------------------------------------
*/
$(document).ready(function(){
  printApp = PrintApp.instance();
  // ko.applyBindings(printApp);
});
