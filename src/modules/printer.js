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

    var waypoints = roadbook.find('.waypoint-tulip');
    for(i=0;i<waypoints.length;i++){
      var img = $('<img>').attr('src',this.waypoints[i].tulip)
      $(waypoints[i]).html(img);
    }

    content.append($('<div>').attr('id', "roadbook").html(roadbook.html()));
    this.print(content);
  },

  print: function(content){

    var pri = $("#ifmcontentstoprint")[0].contentWindow;
    pri.document.open();
    // var content = "data:text/html;charset=utf-8," + content.html();
    // var pri = window.open(content, "print roadbook","status=1,width=500,height=700")

    pri.document.write(content.html());
    pri.document.close();
    pri.focus();
    pri.print();
  },
});
