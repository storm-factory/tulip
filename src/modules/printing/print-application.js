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
// TODO get rid of singleton badness
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

    this.pageSizes = ko.observableArray([{text: "Letter", value: "Letter"}, {text: 'A5', value: 'A5'}, {text: 'Roll', value: 'Roll'}]);
    this.pageSize = ko.observable();
    this.ipc.send('print-launched', true);
  },

  parseJson: function(json){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.waypoints(json.waypoints);
    this.filePath = json.filePath;

    // Default to Letter Format
    this.addPageBreaks()
  },

  requestPdfPrint: function(){
    $('nav').hide();
    this.rerenderForPageSize()
    var size = this.pageSize();
    if(size == "Roll"){
      size = {height: $(document).height()*265, width: $(document).width()*265};
    }
    if((size == "Letter")){
      $('body').css('margin-left', '-60px');
    }
    if((size == "Roll")){
      $('body').css('margin-left', '-30px');
    }
    var data = {'filepath': this.filePath, 'opts': {'pageSize': size, 'marginsType' : '1'}};

    this.ipc.send('print-pdf', data);
  },

  rerenderForPageSize: function(){
    var pageSize = this.pageSize();
    $('.waypoint, .waypoint-note, .waypoint-distance, .waypoint-tulip').removeClass('A5');
    $('.break').remove();
    if((pageSize == "Letter" || pageSize == "A5")){
      this.addPageBreaks();
      //adjust height for A5

      if(pageSize == "A5"){
        $('.waypoint, .waypoint-note, .waypoint-distance, .waypoint-tulip').addClass('A5');
      }
    }
  },

  addPageBreaks(){
    if( $('.break').length > 0) { return };
    $('#roadbook').find('#roadbook-header').after($('<div>').attr('class', 'break'));
    var waypoints = $('#roadbook').find('.waypoint');
    // Default to Letter Format
    for(i=0;i<waypoints.length;i++){
      if((((i+1)%5) == 0) && (i > 0)){
        $(waypoints[i]).after($('<div>').attr('class', 'break'));
      }
    }
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

  $('#print-size').change(function(){
    printApp.rerenderForPageSize();
  });
  $('.button').click(function(){
    printApp.requestPdfPrint();
  });
});
