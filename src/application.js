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
          var json = JSON.parse(data);
          /*
            TODO Refactor this into a function in the roadbook module
          */
          _this.roadbook.name(json.name);
          _this.roadbook.desc(json.desc);
          _this.roadbook.totalDistance(json.totalDistance);
          _this.roadbook.filePath = json.filePath; // TODO figure out what to do if the user changes the name of the file probably use fileNames[0]
          var points = json.waypoints;
          var wpts = []
          // NOTE: For some strange reason, due to canvas rendering, a for loop causes points and waypoints to be skipped, hence for...of in
          for(point of points){
            var latLng = new google.maps.LatLng(point.lat, point.long)
            var routePoint = _this.mapEditor.addRoutePoint(latLng, null, true); //this returns a point
            if(point.waypoint){
              var opts = _this.mapEditor.addWaypoint(routePoint); //this returns distance opts but if we already have that saved then why do we care?
              opts.tulipJson = point.tulipJson;
              opts.angles.heading = point.heading;
              routePoint.waypoint =  _this.roadbook.addWaypoint(opts);
            }
          }
        });
    });
  },

  saveRoadBook: function(){
    var _this = this
    // TODO determine users OS and derive where to save roadbooks by default (to documents or something defined at install or in preferences)
    // come up with a default directory in the preferences
    // var OSName="Unknown OS";
    // if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
    // if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
    // if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
    // if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
    //
    // console.log('Your OS: '+OSName);
    var tulipFile = this.roadbook.save();
    if(tulipFile.filePath == null){
      var title = this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : this.roadbook.name().replace(' ', '-')
      this.dialog.showSaveDialog({
                                  title: 'Save your roadbook',
                                  defaultPath: title,
                                  filters: [{ name: 'tulip', extensions: ['tlp'] }]
        },function (fileName) {
        if (fileName === undefined) return;
          // assign the file path to the json for first time players
          // TODO figure out what to do if the user changes the name of the file
          tulipFile.filePath = fileName;
          tulipFile = JSON.stringify(tulipFile, null, 2);
          _this.fs.writeFile(fileName, tulipFile, function (err) {});
      });
    } else {
      this.fs.writeFile(tulipFile.filePath, JSON.stringify(tulipFile, null, 2), function (err) {});
    }

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
        $('.waypoint.row').show();
        $('#waypoint-palette').hide();
        $('#roadbook-desc, #roadbook-name').find(':input').hide('fast');
        $('#roadbook-desc, #roadbook-name').find('a').show('fast');
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

    $('.track-grid').click(function(){
      if($(this).hasClass('undo')){
        _this.roadbook.currentlyEditingTulip.removeLastTrack();
        return
      }
      var angle = $(this).data('angle');
      _this.roadbook.currentlyEditingTulip.addTrack(angle);
    });

    $('.glyph-grid').click(function(){

      var position = {top: $(this).data('top'), left: $(this).data('left')};
      var uri = $("#active-tulip-glyph").find('img').attr('src');
      _this.roadbook.currentlyEditingTulip.addGlyph(position,uri);
    });

    $('.glyph').click(function(){

      var src = $(this).attr('src');
      $("#active-tulip-glyph").find('img').attr('src', src);
      $("#active-tulip-glyph").show();
      $(this).parents('.reveal-modal').foundation('reveal', 'close');
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
