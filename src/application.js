/*
  Define the application object as a singleton
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
    App persistence
    TODO create a persistence module and move this into it.
  */

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

  initListeners: function(){
    /*
        App Listeners
    */
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
      if(_this.roadbook.finishCanvasEdit() || _this.roadbook.newWaypoints){
        $(this).addClass('secondary');
        _this.saveRoadBook();
      }
      $(this).blur();
    });
  },
});
/*
  instantiate the application
*/
$(document).ready(function(){
  app = App.instance();
  ko.applyBindings(app.roadbook);
});
/*
  instantiate the google map
*/
function initMap() {
  app.mapEditor = MapEditor.instance();
  app.mapControls.map = app.mapEditor.map;
}
