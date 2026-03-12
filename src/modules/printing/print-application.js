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
// Phase 6: Converted to vanilla JavaScript
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
    var breaks = document.querySelectorAll('.break');
    breaks.forEach(function(br){ br.remove(); });
	this.addPageBreaks();
  },

  requestPdfPrint: function(){
    var nav = document.querySelector('nav');
    if(nav) nav.style.display = 'none';

    this.rerenderForPageSize();
	this.rerenderForNumberFormat();
    var pageFormat = this.pageFormat();
    var pageLength = this.pageLength();
    var sizeName = pageFormat + '_' + pageLength;
	var size = 'Letter';

	var pageCss=document.createElement("style");
	pageCss.type = "text/css";

	var html = document.querySelector('html');

   if((pageFormat == 'Letter') && (pageLength == 'Page')){
		size = 'Letter';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
	if((pageFormat == 'Letter') && (pageLength == 'Roll')){
		size = {height: document.documentElement.scrollHeight*265+100000, width: 216000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
    if((pageFormat == 'Legal') && (pageLength == 'Page')){
		size = 'Legal';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:20px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
	if((pageFormat == 'Legal') && (pageLength == 'Roll')){
		size = {height: document.documentElement.scrollHeight*265+100000, width: 216000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
    if((pageFormat == 'A5') && (pageLength == 'Page')){
		size = 'A5';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
	if((pageFormat == 'A5') && (pageLength == 'Roll')){
		size = {height: document.documentElement.scrollHeight*265+100000, width: 148000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:40px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
    if((pageFormat == 'PackedLetter') && (pageLength == 'Page')){
		size = 'Letter';
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:2px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}
	if((pageFormat == 'PackedLetter')	&& (pageLength == 'Roll')){
		size = {height: document.documentElement.scrollHeight*265+100000, width: 216000};
		pageCss.innerHTML = "@page{margin-left:0px; margin-top:0px; margin-right:0px; margin-bottom:0px}";
		if(html) html.style.marginLeft = '25px';
	}

	document.body.appendChild(pageCss);

    var data = {'filepath': this.filePath, 'opts': {'pageSize': size, 'pageSizeName': sizeName, 'marginsType' : '1'}};

    this.ipc.send('print-pdf', data);
  },

  rerenderForPageSize: function(){
	var pageFormat = this.pageFormat();
	var pageLength = this.pageLength();

	var waypoints = document.querySelectorAll('.waypoint');
	waypoints.forEach(function(wp){
		wp.classList.remove('Letter');
		wp.classList.remove('Legal');
		wp.classList.remove('A5');
		wp.classList.remove('PackedLetter');
	});

	if((pageFormat == 'Letter')){
		waypoints.forEach(function(wp){ wp.classList.add('Letter'); });
	}
	if((pageFormat == 'Legal')){
		waypoints.forEach(function(wp){ wp.classList.add('Legal'); });
	}
	if((pageFormat == 'A5')){
		waypoints.forEach(function(wp){ wp.classList.add('A5'); });
	}
	if((pageFormat == 'PackedLetter')){
		waypoints.forEach(function(wp){ wp.classList.add('PackedLetter'); });
	}

    var breaks = document.querySelectorAll('.break');
    breaks.forEach(function(br){ br.remove(); });

    if((pageLength == "Page")){
      this.addPageBreaks();
	}
  },
  rerenderForNumberFormat: function(){
    var numberFormat = this.numberFormat();
	var hundredthDigits = document.querySelectorAll('.hundredthDigit');

	hundredthDigits.forEach(function(digit){
		digit.classList.remove('none');
		digit.classList.remove('outline');
	});

	if(numberFormat == "Outline"){
		hundredthDigits.forEach(function(digit){
			digit.classList.add('outline');
		});
	}
	if(numberFormat == "None"){
		hundredthDigits.forEach(function(digit){
			digit.classList.add('none');
		});
	}
  },
  addPageBreaks(){
    var pageFormat = this.pageFormat();
	var roadbook = document.querySelector('#roadbook');
	if(!roadbook) return;

	var roadbookHeader = roadbook.querySelector('#roadbook-header');
	if(roadbookHeader){
		var breakDiv = document.createElement('div');
		breakDiv.setAttribute('class', 'break');
		roadbookHeader.after(breakDiv);
	}

	var waypoints = roadbook.querySelectorAll('.waypoint');
	var offset = 1;
	var interval = 1;

	if(pageFormat == 'Letter') interval = 7;
	if(pageFormat == 'Legal') interval = 10;
	if(pageFormat == 'A5') interval = 5;
	if(pageFormat == 'PackedLetter') interval = 8;

	for(i=0;i<waypoints.length;i++){
		if((((i+offset)%interval) == 0) && (i>0)){
			var breakDiv = document.createElement('div');
			breakDiv.setAttribute('class', 'break');
			waypoints[i].after(breakDiv);
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
document.addEventListener('DOMContentLoaded', function(){
  printApp = PrintApp.instance();
  ko.applyBindings(printApp);

  window.addEventListener('scroll', function() {
    var mainNav = document.querySelector(".main-nav");
    if(mainNav){
      if(window.scrollY > 0){
        mainNav.classList.add("main-nav-scrolled");
      } else {
        mainNav.classList.remove("main-nav-scrolled");
      }
    }
  });

  var pageFormat = document.querySelector('#page-format');
  if(pageFormat){
    pageFormat.addEventListener('change', function(){
      printApp.rerenderForPageSize();
    });
  }

  var pageLength = document.querySelector('#page-length');
  if(pageLength){
    pageLength.addEventListener('change', function(){
      printApp.rerenderForPageSize();
    });
  }

  var numberFormat = document.querySelector('#number-format');
  if(numberFormat){
    numberFormat.addEventListener('change', function(){
      printApp.rerenderForNumberFormat();
    });
  }

  var buttons = document.querySelectorAll('.button');
  buttons.forEach(function(button){
    button.addEventListener('click', function(){
      printApp.requestPdfPrint();
    });
  });
});
