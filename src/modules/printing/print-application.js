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

    this.pageFormats = ko.observableArray([
		{text:"Letter", value:"Letter"},
		{text:"Legal",  value:"Legal"},
		{text:"A5",     value:"A5"},
		{text:"PackedLetter", value:"PackedLetter"}
		]);
    this.pageFormat = ko.observable();
    this.pageLengths = ko.observableArray([
		{text: "Page", value: "Page"},
		{text: "Roll", value: "Roll"}
		]);
    this.pageLength = ko.observable();
	this.numberFormats = ko.observableArray([
		{text: "Plain Hundredths", value: "Plain"},
		{text: "Outline Hundredths", value:"Outline"},
		{text: "No Hundredths", value:"None"}
		]);
	this.numberFormat = ko.observable();
    this.ipc.send('print-launched', true);
  },

  parseJson: function(json){
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.waypoints(json.waypoints);
    this.filePath = json.filePath;

    // Default to Letter Format
    $('.break').remove();
	this.addPageBreaks();
  },

  requestPdfPrint: function(){
    $('nav').hide();
    this.rerenderForPageSize();
	this.rerenderForNumberFormat();
    var pageFormat = this.pageFormat();
    var pageLength = this.pageLength();
    var sizeName = pageFormat + '_' + pageLength;
	var size = 'Letter';

	var pageCss=document.createElement("style");
	pageCss.type = "text/css";

   if((pageFormat == 'Letter') && (pageLength == 'Page')){
		size = 'Letter';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
	if((pageFormat == 'Letter') && (pageLength == 'Roll')){
		size = {height: $(document).height()*265+100000, width: 216000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
    if((pageFormat == 'Legal') && (pageLength == 'Page')){
		size = 'Legal';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:20px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
	if((pageFormat == 'Legal') && (pageLength == 'Roll')){
		size = {height: $(document).height()*265+100000, width: 216000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
    if((pageFormat == 'A5') && (pageLength == 'Page')){
		size = 'A5';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
	if((pageFormat == 'A5') && (pageLength == 'Roll')){
		size = {height: $(document).height()*265+100000, width: 148000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
    if((pageFormat == 'PackedLetter') && (pageLength == 'Page')){
		size = 'Letter';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:2px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}
	if((pageFormat == 'PackedLetter')	&& (pageLength == 'Roll')){
		size = {height: $(document).height()*265+100000, width: 216000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:0px; margin-right:0px; margin-bottom:0px}";
		$('html').css('margin-left', '25px');
	}

	document.body.appendChild(pageCss);

    var data = {'filepath': this.filePath, 'opts': {'pageSize': size, 'pageSizeName': sizeName, 'marginsType' : 1}};

    this.ipc.send('print-pdf', data);
  },

  rerenderForPageSize: function(){
	var pageFormat = this.pageFormat();
	var pageLength = this.pageLength();
	 $('.waypoint').removeClass('Letter');
	 $('.waypoint').removeClass('Legal');
	 $('.waypoint').removeClass('A5');
	 $('.waypoint').removeClass('PackedLetter');
	if((pageFormat == 'Letter')) $('.waypoint').addClass('Letter');
	if((pageFormat == 'Legal')) $('.waypoint').addClass('Legal');
	if((pageFormat == 'A5')) $('.waypoint').addClass('A5');
	if((pageFormat == 'PackedLetter')) $('.waypoint').addClass('PackedLetter');

    $('.break').remove();
    if((pageLength == "Page")){
      this.addPageBreaks();
	}
  },
  rerenderForNumberFormat: function(){
    var numberFormat = this.numberFormat();
	$('.hundredthDigit').removeClass('none');
	$('.hundredthDigit').removeClass('outline');
	if(numberFormat == "Outline"){
		$('.hundredthDigit').addClass('outline');
	}
	if(numberFormat == "None"){
		$('.hundredthDigit').addClass('none');
	}
  },
  addPageBreaks(){
    var pageFormat = this.pageFormat();
  	$('#roadbook').find('#roadbook-header').after($('<div>').attr('class', 'break'));
	var waypoints = $('#roadbook').find('.waypoint');
	var offset = 1;
	var interval = 1;

	if(pageFormat == 'Letter') interval = 7;
	if(pageFormat == 'Legal') interval = 10;
	if(pageFormat == 'A5') interval = 5;
	if(pageFormat == 'PackedLetter') interval = 8;

	for(i=0;i<waypoints.length;i++){
		if((((i+offset)%interval) == 0) && (i>0)){
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

  $('#page-format').change(function(){
    printApp.rerenderForPageSize();
  });
  $('#page-length').change(function(){
    printApp.rerenderForPageSize();
  });
  $('#number-format').change(function(){
    printApp.rerenderForNumberFormat();
  });
  $('.button').click(function(){
    printApp.requestPdfPrint();
  });
});
