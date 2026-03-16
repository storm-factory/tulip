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

class PrintApp {
  pageSizes;
  pageSize;

  constructor() {
    var _this = this;
    this.settings = null;
    this.name = ko.observable('');
    this.desc = ko.observable('');
    this.customLogo = ko.observable('');
    this.totalDistance = ko.observable('');
    this.waypointCount = ko.observable('');
    this.fuelRange = ko.observable('');
    this.instructions = ko.observableArray([]);
    this.start_lat = ko.observable(0);
    this.start_lon = ko.observable(0);
    this.end_lat = ko.observable(0);
    this.end_lon = ko.observable(0);

    this.ipc = globalNode.ipcRenderer;
    this.ipc.on('print-data', function (event, arg, settings) {
      _this.settings = settings;
      _this.parseJson(arg);
    });

    this.pageSizes = ko.observableArray([{ text: 'A5', value: 'A5' }, { text: 'Roll', value: 'Roll' }]);
    this.pageSize = ko.observable('Roll');
    this.ipc.send('print-launched', true);
  }

  parseJson(json) {
    this.name(json.name);
    this.desc(json.desc);
    this.customLogo(json.customLogo);
    this.totalDistance(json.totalDistance);
    this.fuelRange(json.fuelRange);
    this.instructions(json.instructions);
    this.waypointCount(ko.unwrap(this.instructions).length)
    this.filePath = json.filePath;
    this.start_lat(this.degFormat(json.instructions[0].lat, 'lat'));
    this.start_lon(this.degFormat(json.instructions[0].long, 'lon'));
    this.end_lat(this.degFormat(json.instructions[json.instructions.length - 1].lat, 'lat'));
    this.end_lon(this.degFormat(json.instructions[json.instructions.length - 1].long, 'lon'));
  }

  requestPdfPrint() {
    $('nav').hide();
    this.rerenderForPageSize()
    var size = this.pageSize();
    const dpi = 150;
    var margins = {
          'top': 10 / 25.4,
          'bottom': 10 / 25.4,
          'left': 10 / 25.4,
          'right': 10 / 25.4
        }
    if (size == "Roll") {
      const roadBookWidthMm = 150;
      const pageWidth = roadBookWidthMm / 25.4;
      const docAspect = $(document).height() / $(document).width()

      size = {
        width: pageWidth,
        height: pageWidth * docAspect
      }
      margins = {
          'top': 10 / 25.4,
          'bottom': 10 / 25.4,
          'left': 4.5 / 25.4,
          'right': 4.5 / 25.4
        }
    }
    var data = {
      'filepath': this.filePath,
      'opts': {
        'pageSize': size,
        'margins': margins,
        'dpi': dpi
      }
    };

    globalNode.printToPdf(data);
  }

  rerenderForPageSize() {
    var pageSize = this.pageSize();
    $('.waypoint, .waypoint-note, .waypoint-distance, .waypoint-tulip').removeClass('A5');
    $('.break').remove();

    if (pageSize == "A5") {
      this.addPageBreaks();
      $('.waypoint, .waypoint-note, .waypoint-distance, .waypoint-tulip').addClass('A5');
    }
  }

  addPageBreaks() {
    if ($('.break').length > 0) { return };
    $('#roadbook').find('#roadbook-header').after($('<div>').attr('class', 'break'));
    var instructions = $('#roadbook').find('.waypoint')

    // Default to A5 Format
    for (var i = 0; i < instructions.length; i++) {
      if ((((i + 1) % 5) == 0) && (i > 0)) {
        $(instructions[i]).after($('<div>').attr('class', 'break'));
        $(instructions[i]).css("border-bottom", "2px solid");
      }
    }
  }

  degFormat(coordinate, type) {
    if (type == 'lon') {
      suffix = (coordinate >= 0 ? 'E' : 'W');
    } else {
      suffix = (coordinate >= 0 ? 'N' : 'S');

    }
    coordinate = Math.abs(coordinate);
    var d = Math.floor(coordinate);
    var m = (coordinate - d) * 60;
    var s = (m - Math.floor(m)) * 60;
    var suffix;
    switch (this.settings.coordinatesFormat) {
      case 'dd':
        return coordinate.toFixed(6) + '&deg;' + suffix;
      case 'ddmm':
        return d + '&deg; ' + m.toFixed(3) + "'" + suffix;
      case 'ddmmss':
        return d + '&deg; ' + Math.floor(m) + "' " + s.toFixed(3) + '"' + suffix;
      default:
        return coordinate.toFixed(6) + '&deg;' + suffix;
    }
  }
};

/*
  ---------------------------------------------------------------------------
  Instantiate the application
  ---------------------------------------------------------------------------
*/
var printApp;
$(document).ready(function () {
  printApp = new PrintApp();
  ko.applyBindings(printApp);

  $(window).scroll(function () {
    if ($(this).scrollTop() > 0) {
      $(".main-nav").addClass("main-nav-scrolled");
    } else {
      $(".main-nav").removeClass("main-nav-scrolled");
    }
  });

  $('#print-size').on('change', function () {
    printApp.rerenderForPageSize();
  });
  $('.button').on('click', function () {
    document.getElementById('overlay').style.display = 'flex';
    printApp.requestPdfPrint();
  });
});
