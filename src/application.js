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
    // this.fs = require('fs');
  },

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  /*

  */
  canSave: function(){
    return _this.roadbook.finishCanvasEdit() || _this.roadbook.newWaypoints
  },

  openRoadBook: function(){
    dialog.showOpenDialog(function (fileNames) {
    });
  },

  saveRoadBook: function(){

    var fs = require('fs');
    var tulipFile = JSON.stringify(this.roadbook.save());
    this.dialog.showSaveDialog({ filters: [
       { name: 'tulip', extensions: ['tlp'] }
      ]},function (fileName) {
      if (fileName === undefined) return;
        fs.writeFile(fileName, tulipFile, function (err) {});
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



    $('#save-roadbook').click(function(){
      if(this.canSave()){ //make method
        $(this).addClass('secondary');
        _this.saveRoadBook();
      }
      $(this).blur();
    });

    $('#roadbook-desc, #roadbook-name').find('a').click(function(){

      $(this).parent('div').find(':input').toggle('fast');
    });

    $('#roadbook-desc, #roadbook-name').find(':input').keyup(function(){
      // on we click we also need to make the save dialog available
      // and assign this text to the roadbook.
      $(this).parent('div').find('p').text($(this).val());
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
