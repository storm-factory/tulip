/*
  ---------------------------------------------------------------------------
  Define the application object as a singleton

  This class is the main IO interface between the user an the application

  Logically the Heirarchy of Application logic is:
    -> Application
     Modules:
     -> Mapping
      -> Roadbook
       -> Waypoint
        -> Tulip
         -> TrackEditor

    The Application handles bootstrapping the user interface and any non Mapping
    function. The UI is mainly composed to the UI Map which is managed by the
    MapEditor object. The Map Editor creates Waypoints based off interaction.
    Each Waypoint has a Tulip which is edited by the TulipEditor.
  ---------------------------------------------------------------------------
*/
var App = Class({
  singleton: true,

  create: function(){
    /*
      declare some state instance variables
    */

    //persistence objects
    this.remote = require('remote');
    this.dialog = this.remote.require('dialog');
    /*
      instantiate the roadbook
    */
    this.roadbook = new Roadbook();

    /*
      initialize UI listeners
    */
    this.initListeners();
    this.mapControls = MapControls.instance();
    /*
      file io
    */
    this.fs = require('fs');
  },

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  /*
    TODO this isn't working for 'opened' roadbooks
  */
  canSave: function(){
    var can;
    can = this.roadbook.finishCanvasEdit();
    can = can || this.roadbook.newWaypoints;
    can = can || this.roadbook.finishNameDescEdit();
    return can;
  },

  openRoadBook: function(){
    var _this = this;
    this.dialog.showOpenDialog({ filters: [
       { name: 'tulip', extensions: ['tlp'] }
      ]},function (fileNames) {
      var fs = require('fs');
      if (fileNames === undefined) return;
        var fileName = fileNames[0];
        _this.fs.readFile(fileName, 'utf-8', function (err, data) {
          var roadbook = JSON.parse(data);
          /*
            TODO Refactor this into a function in the roadbook module
          */
          _this.roadbook.name(roadbook.name);
          _this.roadbook.desc(roadbook.desc);
          var points = roadbook.waypoints;
          for(i=0;i<points.length;i++){
            var latLng = new google.maps.LatLng(points[i].lat, points[i].long)
            var point = _this.mapEditor.addRoutePoint(latLng);
            if(points[i].waypoint && i > 0){
              _this.mapEditor.addWaypoint(point);
              var waypoint = point.waypoint;
              console.log(waypoint);
            }
          }
        });
    });
  },

  saveRoadBook: function(){
    var _this = this
    var tulipFile = JSON.stringify(this.roadbook.save());
    this.dialog.showSaveDialog({ filters: [
       { name: 'tulip', extensions: ['tlp'] }
      ]},function (fileName) {
      if (fileName === undefined) return;
        _this.fs.writeFile(fileName, tulipFile, function (err) {});
    });
  },

  /*
    ---------------------------------------------------------------------------
    Roadbook Listeners
    ---------------------------------------------------------------------------
  */
  initListeners: function(){

    var _this = this
    $('#draw-route').click(function(){

    });

    $('#toggle-roadbook').click(function(){
      $('.roadbook-container').toggleClass('collapsed');
      $('.roadbook-container').toggleClass('expanded');

      $('#toggle-roadbook i').toggleClass('fi-arrow-down');
      $('#toggle-roadbook i').toggleClass('fi-arrow-up');
      $(this).blur();
    });

    $('#new-roadbook').click(function(){
      //TODO Something less hacky please
      location.reload();
    });

    $('#open-roadbook').click(function(){
      _this.openRoadBook();
    });

    $('#save-roadbook').click(function(){
      if(_this.canSave()){
        $(this).addClass('secondary');
        _this.saveRoadBook();
      }
      $(this).blur();
    });

    $('#roadbook-desc, #roadbook-name').find('a').click(function(){
      $(this).hide();
      $(this).parent('div').find(':input').toggle('fast');
      var text = $(this).parent('div').find(':input').val();
      if(text == "Name:" || text == "Description:"){
        $(this).parent('div').find(':input').val('');
      } else {
        $(this).parent('div').text();
      }
      $(this).parent('div').find(':input').focus();
      $('#save-roadbook').removeClass('secondary');
      _this.roadbook.editingNameDesc = true;
    });
  },
});
/*
  ---------------------------------------------------------------------------
  Instantiate the application
  ---------------------------------------------------------------------------
*/
$(document).ready(function(){
  app = App.instance();
  ko.applyBindings(app.roadbook);
  $(document).foundation();
});
/*
  ---------------------------------------------------------------------------
  Instantiate the google map
  ---------------------------------------------------------------------------
*/
function initMap() {
  app.mapEditor = MapEditor.instance();
  app.mapControls.map = app.mapEditor.map;
}
