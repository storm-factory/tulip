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
    this.currentlyEditing = false;
    this.currentlyEditingObject = null;

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

  requestEdit: function(object){
    if(object != this.currentlyEditingObject){
      if(this.currentlyEditingObject){
        this.currentlyEditingObject.finishEdit();
      }
      this.currentlyEditingObject = object;
      this.currentlyEditing = true;
      $('#save-roadbook i').show();
      return true;
    }
  },

  finishEdit: function(){
    if(this.currentlyEditing){
      this.currentlyEditing = false;
      $('#save-roadbook i').hide();
      return true;
    }
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
    });

    $('#save-roadbook').click(function(){
      // TODO this creates a weird coupling workflow, make more make this listener more single principle.
      if(_this.finishEdit()){
        for(i = 0; i < _this.roadbook.waypoints().length; i++){
          _this.currentlyEditingObject.finishEdit();
          _this.currentlyEditingObject = null;
          //TODO save app state
        }
      }
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
function initMap() {
  app.mapEditor = MapEditor.instance();
  app.mapControls.map = app.mapEditor.map;
}
