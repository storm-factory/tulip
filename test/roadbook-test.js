QUnit.module( "Roadbook", {
  before: function() {
    this.waypointOneJSON = JSON.parse('{"lat": 37.123,"lng": -107.456,"waypoint": true,"distances":{"kmFromStart": 0.0,"kmFromPrev": 0.0},"angles":{"heading": 123},"entryTrackType": "track","exitTrackType": "track","notes": {"text": "<div><b>some notes and such one</b></div>","glyphs": [{"src": "../assets/svg/glyphs/bad.svg"}]},"tulipJson": {"entry": {"point": {"type": "circle","originX": "center","originY": "center","left": 90,"top": 171,"width": 10,"height": 10,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","radius": 5,"startAngle": 0,"endAngle": 6.283185307179586},"path": {"type": "path","originX": "center","originY": "center","left": 90,"top": 130.5,"width": 2.18,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,171],["C",89.76254389700952,156.2925867292477,89.76254389700952,156.2925867292477,90,150],["C",90.36254389700952,140.39258672924768,92,127.59733338600616,92,118],["C",92,109.59733338600614,90,90,90,90]],"pathOffset": {"x": 90,"y": 130.5}}},"exit": {"point": {"type": "triangle","originX": "center","originY": "center","left": 9,"top": 73,"width": 12,"height": 12,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": -62.73,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over"},"path": {"type": "path","originX": "center","originY": "center","left": 49.5,"top": 88,"width": 81,"height": 17,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",67.601017185849,87.88898307276379,67.601017185849,87.88898307276379,58,87],["C",51.40101718584901,86.38898307276379,42.2887417154549,86.79678334727282,36,85],["C",27.588741715454898,82.59678334727283,9,73,9,73]],"pathOffset": {"x": 49.5,"y": 88}}},"tracks": [{"type": "path","originX": "center","originY": "center","left": 90,"top": 49.5,"width": 0,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",90,81,90,72,90,63],["C",90,54,90,45,90,36],["C",90,27,90,18,90,9]],"pathOffset": {"x": 90,"y": 49.5}},{"type": "path","originX": "center","originY": "center","left": 130.5,"top": 90,"width": 81,"height": 0,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",99,90,108,90,117,90],["C",126,90,135,90,144,90],["C",153,90,162,90,171,90]],"pathOffset": {"x": 130.5,"y": 90}}],"glyphs": [{"type": "image","originX": "center","originY": "center","left": 30,"top": 140,"width": 250,"height": 250,"fill": "rgb(0,0,0)","stroke": null,"strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 0.3,"scaleY": 0.3,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","src": "../assets/svg/glyphs/buildings.svg","filters": [],"crossOrigin": "","alignX": "none","alignY": "none","meetOrSlice": "meet"}]}}');
    this.waypointTwoJSON = JSON.parse('{"lat": 37.456,"lng": -107.789,"waypoint": true,"distances":{"kmFromStart": 1.23,"kmFromPrev": 1.23},"angles":{"heading": 321},"entryTrackType": "track","exitTrackType": "track","notes": {"text": "<div><b>some notes and such two </b></div>","glyphs": [{"src": "../assets/svg/glyphs/bad.svg"}]},"tulipJson": {"entry": {"point": {"type": "circle","originX": "center","originY": "center","left": 90,"top": 171,"width": 10,"height": 10,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","radius": 5,"startAngle": 0,"endAngle": 6.283185307179586},"path": {"type": "path","originX": "center","originY": "center","left": 90,"top": 130.5,"width": 2.18,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,171],["C",89.76254389700952,156.2925867292477,89.76254389700952,156.2925867292477,90,150],["C",90.36254389700952,140.39258672924768,92,127.59733338600616,92,118],["C",92,109.59733338600614,90,90,90,90]],"pathOffset": {"x": 90,"y": 130.5}}},"exit": {"point": {"type": "triangle","originX": "center","originY": "center","left": 9,"top": 73,"width": 12,"height": 12,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": -62.73,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over"},"path": {"type": "path","originX": "center","originY": "center","left": 49.5,"top": 88,"width": 81,"height": 17,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",67.601017185849,87.88898307276379,67.601017185849,87.88898307276379,58,87],["C",51.40101718584901,86.38898307276379,42.2887417154549,86.79678334727282,36,85],["C",27.588741715454898,82.59678334727283,9,73,9,73]],"pathOffset": {"x": 49.5,"y": 88}}},"tracks": [{"type": "path","originX": "center","originY": "center","left": 90,"top": 49.5,"width": 0,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",90,81,90,72,90,63],["C",90,54,90,45,90,36],["C",90,27,90,18,90,9]],"pathOffset": {"x": 90,"y": 49.5}},{"type": "path","originX": "center","originY": "center","left": 130.5,"top": 90,"width": 81,"height": 0,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",99,90,108,90,117,90],["C",126,90,135,90,144,90],["C",153,90,162,90,171,90]],"pathOffset": {"x": 130.5,"y": 90}}],"glyphs": [{"type": "image","originX": "center","originY": "center","left": 30,"top": 140,"width": 250,"height": 250,"fill": "rgb(0,0,0)","stroke": null,"strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 0.3,"scaleY": 0.3,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","src": "../assets/svg/glyphs/buildings.svg","filters": [],"crossOrigin": "","alignX": "none","alignY": "none","meetOrSlice": "meet"}]}}');
  },
  beforeEach: function() {
    this.app = new App();
    app = this.app;
    ko.applyBindings(app.roadbook,$("#content")[0]);

    this.app.roadbook.addWaypoint(this.waypointOneJSON);
    this.app.roadbook.addWaypoint(this.waypointTwoJSON);
    this.roadbook = this.app.roadbook;
  },
  afterEach: function() {
    ko.cleanNode($('#content')[0]);
    this.app = null;
    app = null;
  },

});

function tracksAlteredCorrectly(waypointOne, waypointOneInitialTrack, waypointTwo, waypointTwoInitialTrack){
  var correct = waypointOne.exitTrackType != waypointOneInitialTrack
  correct = correct && waypointOne.exitTrackType != waypointOneInitialTrack
  correct = correct && waypointTwo.entryTrackType != waypointTwoInitialTrack
  correct = correct && waypointOne.exitTrackType == waypointTwo.entryTrackType;

  return correct;
}

QUnit.test("Describe Create Waypoints from JSON", function( assert ) {
  // var roadbook = roadbookFactory();

  assert.equal(this.roadbook.waypoints().length, 2, "It can add waypoints from JSON")
});

QUnit.test("Describe changeEntryTrackType", function( assert ) {
  // var roadbook = roadbookFactory();

  var waypointOneInitialTrack = this.roadbook.waypoints()[0].exitTrackType;
  var waypointTwoInitialTrack = this.roadbook.waypoints()[1].entryTrackType;
  this.roadbook.currentlyEditingWaypoint  = this.roadbook.waypoints()[1];

  this.roadbook.changeEditingWaypointEntry('offPiste');
  assert.ok(tracksAlteredCorrectly(this.roadbook.waypoints()[0], waypointOneInitialTrack, this.roadbook.waypoints()[1], waypointTwoInitialTrack), "It changes exit of previous waypoint")

  this.roadbook.currentlyEditingWaypoint  = this.roadbook.waypoints()[0];

  this.roadbook.changeEditingWaypointEntry('road');
  assert.equal(this.roadbook.waypoints()[0].entryTrackType, 'road', "It doesn't error for first waypoint")
});

QUnit.test("Describe changeExitTrackType", function( assert ) {
  // var roadbook = roadbookFactory();

  var waypointOneInitialTrack = this.roadbook.waypoints()[0].exitTrackType;
  var waypointTwoInitialTrack = this.roadbook.waypoints()[1].entryTrackType;
  this.roadbook.currentlyEditingWaypoint  = this.roadbook.waypoints()[0];

  this.roadbook.changeEditingWaypointExit('road');
  assert.ok(tracksAlteredCorrectly(this.roadbook.waypoints()[0], waypointOneInitialTrack, this.roadbook.waypoints()[1], waypointTwoInitialTrack), "It changes entry of the next waypoint")

  this.roadbook.currentlyEditingWaypoint  = this.roadbook.waypoints()[1];

  this.roadbook.changeEditingWaypointExit('road');
  assert.equal(this.roadbook.waypoints()[0].exitTrackType, 'road', "It doesn't error for last waypoint")
});

// TODO write these tests then features
QUnit.test("Describe changeEntryTrackType changes all track types until it reaches a change", function( assert ) {assert.expect(0)});
// TODO write these tests then features
QUnit.test("Describe changeExitTrackType changes all track types until it reaches a change", function( assert ) {assert.expect(0)});
