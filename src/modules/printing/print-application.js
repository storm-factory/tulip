/*
  ---------------------------------------------------------------------------
  Define the print application object as a singleton

  This class is the main IO interface between the user an the printing application

  References:
  http://blog.teamtreehouse.com/cross-domain-messaging-with-postmessage
  http://electron.atom.io/docs/api/web-contents/
  http://electron.atom.io/docs/api/web-contents/#webcontentsprinttopdfoptions-callback
  https://github.com/electron/electron/blob/master/docs/api/window-open.md
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

    this.ipc = require('electron').ipcRenderer;
    this.ipc.on('print-data', function(event, arg){
      _this.parseJson(arg);
    });
    this.ipc.send('print-launched', true);
  },

  parseJson: function(json){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.waypoints(json.waypoints);
    this.filePath = json.filePath;
    $('#roadbook').find('#roadbook-desc').after($('<div>').attr('class', 'break'));
    var waypoints = $('#roadbook').find('.waypoint');
    for(i=0;i<waypoints.length;i++){
      if((((i+1)%4) == 0) && (i > 0)){
        $(waypoints[i]).after($('<div>').attr('class', 'break'));
      }
    }
  },

  requestPdfPrint: function(pagesize){
    var data = {'filepath': this.filePath, 'pagesize': pagesize};
    console.log(data);
    this.ipc.send('print-pdf', data);
  },
});

/*
  ---------------------------------------------------------------------------
  Instantiate the application
  ---------------------------------------------------------------------------
*/
var printApp;
$(document).ready(function(){
  printApp = PrintApp.instance();
  ko.applyBindings(printApp);
});
