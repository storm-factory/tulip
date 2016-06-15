//
// for this parent window
// var myWindow = window.open("./print.html", "Print Roadbook");
// myWindow.postMessage(app.roadbook.statelessJSON(), "file://")
//


//
// for the created child window
//window.addEventListener('message', function(e) {
//   var message = e.data;
//   console.log(message);
//   //check message origin and if so populate a templated roadbook
// });
//
// References
// http://blog.teamtreehouse.com/cross-domain-messaging-with-postmessage
// http://electron.atom.io/docs/api/web-contents/
// https://github.com/electron/electron/blob/master/docs/api/window-open.md
var Printer = Class({
  create: function(roadbookJSON){

    this.name = roadbookJSON.name;
    this.desc = roadbookJSON.desc;
    this.totalDistance = roadbookJSON.totalDistance;
    this.waypoints = roadbookJSON.waypoints;
    this.parseDom();
  },

  parseDom: function(){
    var content = $('<head>').append($('<link>',{href:"assets/css/roadbook-print.css", rel:"stylesheet", type:"text/css"}));
    var roadbook = $("#roadbook").clone()
    roadbook.find('#waypoint-palette, #roadbook-name input, #roadbook-desc textarea').remove();
    roadbook.find('#roadbook-name').html($('#roadbook-name a').text());
    roadbook.find('#roadbook-desc').html($('#roadbook-desc a').text());
    roadbook.find('#roadbook-desc').after($('<div>').attr('class', 'break'));
    roadbook.prepend($('<div>').attr('align', 'center').append($('<img>').attr('src','./assets/tulip-logo3.png').attr('height', '300')))
    var waypoints = roadbook.find('.waypoint');
    for(i=0;i<waypoints.length;i++){
      if((((i+1)%4) == 0) && (i > 0)){
        $(waypoints[i]).after($('<div>').attr('class', 'break'));
      }

      var img = $('<img>').attr('src',this.waypoints[i].tulip)
      $(waypoints[i]).find('.waypoint-tulip').html(img);
    }
    content.append($('<div>').attr('id', "roadbook").html(roadbook.html()));
    this.print(content);
  },

  print: function(content){

    var pri = $("#ifmcontentstoprint")[0].contentWindow;
    pri.document.open();

    pri.document.write(content.html());
    pri.document.close();
    pri.focus();
    pri.print();
  },
});
