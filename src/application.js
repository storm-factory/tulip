/*
  Define the application object as a singleton
*/
var App = Class({
  singleton: true,

  create: function(){
    /*
      declare some state instance variables
    */
    this.drawRoute = false;
    this.currentlyEditingCanvas = false; //Change to be a canvas object specific variable
    this.currentlyEditingCanvasObject = null; //Change to be a canvas object specific variable

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
  },

  /*
    App control flow
  */

  //Need to change to request canvas edit
  requestEdit: function(object){
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

  //Need to change to finish canvas edit
  finishEdit: function(){
    if(this.currentlyEditingCanvas){
      this.currentlyEditingCanvas = false;
      $('#save-roadbook').addClass('secondary');
      return true;
    }
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
    this.dialog.showSaveDialog(function (fileName) {
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


    //TODO create way of tracking map AND canvas edits
    $('#save-roadbook').click(function(){
      // TODO this creates a weird coupling workflow, make more make this listener more single principle.
      if(_this.finishEdit()){
        for(i = 0; i < _this.roadbook.waypoints().length; i++){
          _this.currentlyEditingCanvasObject.finishEdit();
          _this.currentlyEditingCanvasObject = null;
          //TODO save app state
        }
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
