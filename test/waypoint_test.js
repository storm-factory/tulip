var json = JSON.parse('{"lat": 37.29309637989143,"lng": -107.88188248872757,"waypoint": true,"distances":{"kmFromStart": 0.07859896285976317,"kmFromPrev": 0.07859896285976317},"angles":{"heading": 159.4632985285948},"entryTrackType": "track","exitTrackType": "track","notes": {"text": "<div><b>some notes and such</b></div>","glyphs": [{"src": "../assets/svg/glyphs/bad.svg"}]},"tulipJson": {"entry": {"point": {"type": "circle","originX": "center","originY": "center","left": 90,"top": 171,"width": 10,"height": 10,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","radius": 5,"startAngle": 0,"endAngle": 6.283185307179586},"path": {"type": "path","originX": "center","originY": "center","left": 90,"top": 130.5,"width": 2.18,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,171],["C",89.76254389700952,156.2925867292477,89.76254389700952,156.2925867292477,90,150],["C",90.36254389700952,140.39258672924768,92,127.59733338600616,92,118],["C",92,109.59733338600614,90,90,90,90]],"pathOffset": {"x": 90,"y": 130.5}}},"exit": {"point": {"type": "triangle","originX": "center","originY": "center","left": 9,"top": 73,"width": 12,"height": 12,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": -62.73,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over"},"path": {"type": "path","originX": "center","originY": "center","left": 49.5,"top": 88,"width": 81,"height": 17,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",67.601017185849,87.88898307276379,67.601017185849,87.88898307276379,58,87],["C",51.40101718584901,86.38898307276379,42.2887417154549,86.79678334727282,36,85],["C",27.588741715454898,82.59678334727283,9,73,9,73]],"pathOffset": {"x": 49.5,"y": 88}}},"tracks": [{"type": "path","originX": "center","originY": "center","left": 90,"top": 49.5,"width": 0,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",90,81,90,72,90,63],["C",90,54,90,45,90,36],["C",90,27,90,18,90,9]],"pathOffset": {"x": 90,"y": 49.5}},{"type": "path","originX": "center","originY": "center","left": 130.5,"top": 90,"width": 81,"height": 0,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",99,90,108,90,117,90],["C",126,90,135,90,144,90],["C",153,90,162,90,171,90]],"pathOffset": {"x": 130.5,"y": 90}}],"glyphs": [{"type": "image","originX": "center","originY": "center","left": 30,"top": 140,"width": 250,"height": 250,"fill": "rgb(0,0,0)","stroke": null,"strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 0.3,"scaleY": 0.3,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","src": "../assets/svg/glyphs/buildings.svg","filters": [],"crossOrigin": "","alignX": "none","alignY": "none","meetOrSlice": "meet"}]}}');
var tulipPNG= "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAADWUlEQVR4Xu3SAQ0AAAjDMO7fND6W4uCjO6dAqMBCW0xR4ICGIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO40BmoFUAaBT7zQGaAZSBYBOvdMYoBlIFQA69U5jgGYgVQDo1DuNAZqBVAGgU+80BmgGUgWATr3TGKAZSBUAOvVOY4BmIFUA6NQ7jQGagVQBoFPvNAZoBlIFgE690xigGUgVADr1TmOAZiBVAOjUO415PNEAtQUOHXEAAAAASUVORK5CYII="
var tulipJSON = '{"entry":{},"exitTrackUneditedPath":true,"exit":{},"tracks":[],"glyphs":[]}'

QUnit.test("Waypoint Create from JSON", function( assert ) {
    var roadbook = new Roadbook();
    var waypoint = new Waypoint(roadbook, json);
    roadbook.waypoints.push(waypoint);

    assert.ok(waypoint instanceof Waypoint, "It can be created");
    assert.equal(waypoint.kmFromStart(), 0.07859896285976317, "It gets/sets kmFromStart observable");
    assert.equal(waypoint.kmFromPrev(), 0.07859896285976317, "It gets/sets kmFromPrev observable");
    assert.equal(waypoint.exactHeading(), 159.4632985285948, "It gets/sets exactHeading observable");

    assert.equal(waypoint.lat(), 37.29309637989143, "It gets/sets lat observable");
    assert.equal(waypoint.lng(), -107.88188248872757, "It gets/sets lng observable");

    assert.equal(waypoint.distFromPrev(), waypoint.kmFromPrev().toFixed(2), "It computes a usable distFromPrev");
    assert.equal(waypoint.totalDistance(), waypoint.kmFromStart().toFixed(2), "It computes a usable totalDistance");

    var heading = Math.round(waypoint.exactHeading());
    heading =  Array(Math.max(3 - String(heading).length + 1, 0)).join(0) + heading + '\xB0';
    assert.equal(waypoint.heading(), heading, "It computes a usable heading");

    assert.equal(waypoint.entryTrackType, json.entryTrackType, "It take an entry track type");
    assert.equal(waypoint.exitTrackType, json.exitTrackType, "It take an exit track type");

    assert.equal(waypoint.noteHTML(), json.notes.text, "It adds notes from json");
    assert.equal(waypoint.noteGlyphs().length, 1, "It adds glyphs from json");
});

QUnit.test("Waypoint Update", function( assert ) {
  var roadbook = new Roadbook();
  var waypoint = new Waypoint(roadbook, json);
  waypoint.initTulip();

  var distances = {kmFromStart: 123, kmFromPrev: 456};
  var angles = {heading: 123, relativeAngle: 45};
  var mapVertexIndex = 2;
  var latLng = {lat: 37.123, lng: -107.456};
  waypoint.updateWaypoint(distances, angles, latLng, mapVertexIndex);

  assert.equal(waypoint.kmFromPrev(), distances.kmFromPrev, "It can update kmFromPrev")
  assert.equal(waypoint.kmFromStart(), distances.kmFromStart, "It can update kmFromStart")

  assert.equal(waypoint.exactHeading(), angles.heading, "It can update heading")
  assert.equal($(waypoint.tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 96 84 103 77 109 71 C 115 65 122 58 128 52 C 135 45 141 39 147 33", "It updates the tulip exit track if it's unedited");

  assert.equal(waypoint.lat(), latLng.lat, "It can update lat")
  assert.equal(waypoint.lng(), latLng.lng, "It can update lng")
});

QUnit.test("Waypoint Tulip", function( assert ) {
  var roadbook = new Roadbook();
  var waypoint = new Waypoint(roadbook, json);

  // // NOTE really we should figure out why knockout isn't binding correctly to the DOM and calling initTulip() as it should
  var angle = json.angles.relativeAngle;
  var tulipJson = json.tulipJson;
  var trackTypes = {entryTrackType: waypoint.entryTrackType, exitTrackType: waypoint.exitTrackType};
  waypoint.initTulip($('canvas')[0], angle, trackTypes, tulipJson);
  assert.ok(waypoint.tulip instanceof Tulip, "It can create a tulip");
  assert.equal(JSON.stringify(waypoint.serializeTulip()), tulipJSON, "It can export its tulip to JSON");
  assert.equal(waypoint.tulipPNG(), tulipPNG, "It can export its tulip to PNG");
});

QUnit.test("Waypoint Note Glyph", function( assert ) {
  var roadbook = new Roadbook();
  var waypoint = new Waypoint(roadbook, json);
  var src = '../assets/svg/glyphs/always.svg'

  var numGlyphs = waypoint.noteGlyphs().length;
  waypoint.addNoteGlyph(src);
  assert.equal(waypoint.noteGlyphs().length, numGlyphs + 1, "It can add a glyph");

  var numGlyphs = waypoint.noteGlyphs().length;
  var secondToLastGylph = waypoint.noteGlyphs()[waypoint.noteGlyphs().length - 2]
  waypoint.removeLastNoteGlyph();
  assert.equal(waypoint.noteGlyphs().length, numGlyphs - 1, "It can remove a glyph");
  assert.equal(waypoint.noteGlyphs()[waypoint.noteGlyphs().length - 1], secondToLastGylph, "It removes the last glyph");
});

QUnit.test("Waypoint Track Type", function( assert ) {

  var roadbook = new Roadbook();
  var waypoint = new Waypoint(roadbook, json);

  var tulipJson = json.tulipJson;
  waypoint.initTulip($('canvas')[0], 0, undefined, tulipJson);
  var entryTrackType = waypoint.entryTrackType
  waypoint.changeEntryTrackType('offPiste');
  assert.notEqual(waypoint.entryTrackType, entryTrackType, 'It can change the entry track type')
  assert.equal(waypoint.entryTrackType, 'offPiste', 'It can update the entry track type "offPiste"')


  var exitTrackType = waypoint.exitTrackType
  waypoint.changeExitTrackType('road');
  assert.notEqual(waypoint.exitTrackType, exitTrackType, 'It can change the exit track type')
  assert.equal(waypoint.exitTrackType, 'road', 'It can update the exit track type to "road"')

  var addedTrackType = waypoint.tulip.addedTrackType
  waypoint.changeAddedTrackType('road');
  assert.notEqual(waypoint.tulip.addedTrackType, addedTrackType, 'It can change the added track type')
  assert.equal(waypoint.tulip.addedTrackType, 'road', 'It can update the added track type to "road"')
});
