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

    this.pageSizes = ko.observableArray([{text: "Letter", value: "Letter"}, {text: 'A5', value: 'A5'}, {text: 'Roll', value: '{height:'+ ($(window).height()*265)+',width: '+($(window).width()*265)+'}'}]);
    this.pageSize = ko.observable();
    this.ipc.send('print-launched', true);
  },

  parseJson: function(json){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.waypoints(json.waypoints);
    this.filePath = json.filePath;
    /*
      if letter use break after first page, then break every 5
      if A5 use break after first page then break every 4 and maybe adjust height
      if roll don't break

      then hide nav
    */
    // Default to Letter Format
    $('#roadbook').find('#roadbook-desc').after($('<div>').attr('class', 'break'));
    var waypoints = $('#roadbook').find('.waypoint');
    // Default to Letter Format
    for(i=0;i<waypoints.length;i++){
      if((((i+1)%5) == 0) && (i > 0)){
        $(waypoints[i]).after($('<div>').attr('class', 'break'));
      }
    }
  },

  requestPdfPrint: function(opts){
    var data = {'filepath': this.filePath, 'opts': opts};
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

  $(window).scroll(function() {
    if( $(this).scrollTop() > 0 ) {
      $(".main-nav").addClass("main-nav-scrolled");
    } else {
      $(".main-nav").removeClass("main-nav-scrolled");
    }
  });
});
