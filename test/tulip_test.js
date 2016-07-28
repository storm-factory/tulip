QUnit.module( "Tulip", {
  before: function() {
    this.json = JSON.parse('{"entry": {"point": {"type": "circle","originX": "center","originY": "center","left": 90,"top": 171,"width": 10,"height": 10,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","radius": 5,"startAngle": 0,"endAngle": 6.283185307179586},"path": {"type": "path","originX": "center","originY": "center","left": 90,"top": 130.5,"width": 2.18,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,171],["C",89.76254389700952,156.2925867292477,89.76254389700952,156.2925867292477,90,150],["C",90.36254389700952,140.39258672924768,92,127.59733338600616,92,118],["C",92,109.59733338600614,90,90,90,90]],"pathOffset": {"x": 90,"y": 130.5}}},"exit": {"point": {"type": "triangle","originX": "center","originY": "center","left": 9,"top": 73,"width": 12,"height": 12,"fill": "#000","stroke": "#666","strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": -62.73,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over"},"path": {"type": "path","originX": "center","originY": "center","left": 49.5,"top": 88,"width": 81,"height": 17,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",67.601017185849,87.88898307276379,67.601017185849,87.88898307276379,58,87],["C",51.40101718584901,86.38898307276379,42.2887417154549,86.79678334727282,36,85],["C",27.588741715454898,82.59678334727283,9,73,9,73]],"pathOffset": {"x": 49.5,"y": 88}}},"tracks": [{"type": "path","originX": "center","originY": "center","left": 90,"top": 49.5,"width": 0,"height": 81,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",90,81,90,72,90,63],["C",90,54,90,45,90,36],["C",90,27,90,18,90,9]],"pathOffset": {"x": 90,"y": 49.5}},{"type": "path","originX": "center","originY": "center","left": 130.5,"top": 90,"width": 81,"height": 0,"fill": "","stroke": "#000","strokeWidth": 8,"strokeDashArray": [],"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 1,"scaleY": 1,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","path": [["M",90,90],["C",99,90,108,90,117,90],["C",126,90,135,90,144,90],["C",153,90,162,90,171,90]],"pathOffset": {"x": 130.5,"y": 90}}],"glyphs": [{"type": "image","originX": "center","originY": "center","left": 30,"top": 140,"width": 250,"height": 250,"fill": "rgb(0,0,0)","stroke": null,"strokeWidth": 1,"strokeDashArray": null,"strokeLineCap": "butt","strokeLineJoin": "miter","strokeMiterLimit": 10,"scaleX": 0.3,"scaleY": 0.3,"angle": 0,"flipX": false,"flipY": false,"opacity": 1,"shadow": null,"visible": true,"clipTo": null,"backgroundColor": "","fillRule": "nonzero","globalCompositeOperation": "source-over","src": "../assets/svg/glyphs/buildings.svg","filters": [],"crossOrigin": "","alignX": "none","alignY": "none","meetOrSlice": "meet"}]}');

    this.track = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',
                                              { fill: '',
                                                stroke: '#000',
                                                strokeWidth: 5,
                                                hasControls: false,
                                                lockMovementX: true,
                                                lockMovementY: true,
                                                hasBorders: false
                                              });
    this.circle = new fabric.Circle({
      left: this.track.path[0][1],
      top: this.track.path[0][2],
      strokeWidth: 1,
      radius: 7,
      fill: '#000',
      stroke: '#666',
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      hasBorders: false
    });
  },
  beforeEach: function() {
    this.tulip = new Tulip($('canvas')[0], 45, {entryTrackType: 'track', exitTrackType: 'track'}, null);
  },
  afterEach:  function(){
    this.tulip = null;
  },
  after:  function(){
    this.track = null;
    this.circle = null;
  }
});
  QUnit.test("Describe Create", function( assert ) {
    assert.ok(this.tulip.entryTrack !== null && this.tulip.entryTrackOrigin !== null && this.tulip.trackTypes instanceof Object, "It can be created from params")
  });

  QUnit.test("Describe Create From JSON", function( assert ) {
    var tulip = new Tulip($('canvas')[0], null, null, this.json);
    assert.ok(tulip.entryTrack !== null && tulip.entryTrackOrigin !== null && tulip.trackTypes instanceof Object && tulip.tracks.length == 2 && tulip != this.tulip, "It can be created from json")
  });

  QUnit.test("Describe init entry", function( assert ) {
    this.tulip.initEntry(this.circle, this.track);

    assert.ok(this.tulip.entryTrackOrigin == this.circle && this.tulip.entryTrack == this.track && this.tulip.entryTrackOrigin.track == this.track && this.tulip.entryTrack.origin == this.circle, "It can initialize and entry track using a path and circle")
    assert.ok(this.tulip.entryTrack.hasBorders == false && this.tulip.entryTrack.hasControls == false, "It disables the default controls")
  });

  QUnit.test("Describe init exit", function( assert ) {
    this.tulip.initExit(this.circle, this.track);

    assert.ok(this.tulip.exitTrackEnd == this.circle && this.tulip.exitTrack == this.track && this.tulip.exitTrackEnd.track == this.track && this.tulip.exitTrack.end == this.circle, "It can initialize and exit track using a path and circle")
    assert.ok(this.tulip.exitTrack.hasBorders == false && this.tulip.exitTrack.hasControls == false, "It disables the default controls")
  });

  QUnit.test("Describe init tracks", function( assert ) {
    var track = new fabric.Path('M 90 171 C 90, 165, 90, 159, 90, 150 C 90, 141, 90, 129, 90, 120 C 90, 111, 90, 99, 90, 90',{ fill: '', stroke: '#000', strokeWidth: 5});
    this.tulip.initTracks([track]);
    assert.ok(this.tulip.tracks[0].hasControls == false && this.tulip.tracks[0].lockMovementX == true && this.tulip.tracks[0].lockMovementY == true && this.tulip.tracks[0].hasBorders == false && this.tulip.tracks[0].selectable == false, 'It configures an array of tracks')
  });

  QUnit.test("Describe add track", function( assert ) {
    var len = this.tulip.tracks.length;
    var string = "M 90 90 C 96 84 103 77 109 71 C 115 65 122 58 128 52 C 135 45 141 39 147 33";
    this.tulip.addTrack(45);
    assert.equal(len + 1, this.tulip.tracks.length, "it adds the track to the tracks array");
    assert.equal($(this.tulip.tracks[this.tulip.tracks.length-1].toSVG()).attr('d'), string, "it creates the correct SVG for the canvas");
  });

  QUnit.test("Describe build track path string", function( assert ) {
    var string = this.tulip.buildTrackPathString(45);
    assert.equal(string, "M 90 90 C 96, 84, 103, 77, 109, 71 C 115, 65, 122, 58, 128, 52 C 135, 45, 141, 39, 147, 33", "It can create an SVG string when given an angle")
  });

  QUnit.test("Describe build path set", function( assert ) {
    var set = this.tulip.buildPathSet([9,18,27], 45);
    assert.deepEqual(set, [[96,84],[103,77],[109,71]], "It creates a 2D array of point pairs given an array of magnitudes and an angle")
  });

  QUnit.test("Describe Change entry track type", function( assert ) {
    var stroke = this.tulip.entryTrack.get('strokeWidth');
    this.tulip.changeEntryTrackType('road');
    assert.notEqual(stroke, this.tulip.entryTrack.get('strokeWidth'), "it changes the track width to road" )
  });
  QUnit.test("Describe Change exit track type", function( assert ) {
    var stroke = this.tulip.entryTrack.get('strokeDashArray');
    this.tulip.changeEntryTrackType('offPiste');
    assert.notEqual(stroke, this.tulip.entryTrack.get('strokeDashArray'), "it changes the track dash array to off piste" )
  });
  QUnit.test("Describe Change added track type", function( assert ) {
    var trackType = this.tulip.addedTrackType;
    this.tulip.changeAddedTrackType('road');
    assert.notEqual(trackType, this.tulip.addedTrackType, "it changes the added track type in memory" )
  });

  QUnit.test("Describe Change Exit Angle", function( assert ) {

    var beforePath = $(this.tulip.exitTrack.toSVG());

    assert.equal($(this.tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 96 84 103 77 109 71 C 115 65 122 58 128 52 C 135 45 141 39 147 33", "It intializes the path to 45");

    this.tulip.changeExitAngle(100);
    assert.equal($(this.tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 99 92 108 93 117 95 C 125 96 134 98 143 99 C 152 101 161 103 170 104", "It changes the path to 100");
    assert.notEqual(this.tulip.exitTrack.toSVG(),beforePath, "The 45 and 100 path strings are not the same");

    this.tulip.exitTrackChanged = true;
    this.tulip.changeExitAngle(45);
    assert.equal($(this.tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 96 84 103 77 109 71 C 115 65 122 58 128 52 C 135 45 141 39 147 33", "It won't change the angle if the exitTrack has been changed");
  });

  QUnit.test("Describe remove last track", function( assert ) {
    this.tulip.addTrack(45);
    this.tulip.addTrack(135);
    var len = this.tulip.tracks.length
    this.tulip.removeLastTrack();
    assert.equal(len - 1, this.tulip.tracks.length, "it removes the last track" )
  });

  QUnit.test("Describe rotate point", function( assert ) {

    var position = this.tulip.rotatePoint(1,90);
    assert.deepEqual([91,90], position, "it returns canvas coordinates given an angle and magnitude from the center of the canvas correctly for a right turn" )

    var position = this.tulip.rotatePoint(1,-90);
    assert.deepEqual([89,90], position, "it returns canvas coordinates given an angle and magnitude from the center of the canvas correctly for a right turn" )
  });

  QUnit.test("Describe truncate glyph source", function( assert ) {
    var src = "some/path/that/is/not/project/relative/assets/svg/glyphs/buildings.svg"
    var truncatedSrc = this.tulip.truncateGlyphSource(src);
    assert.notEqual(src, truncatedSrc, "it creates a truncated glyph source")
    assert.equal('./assets/svg/glyphs/buildings.svg', truncatedSrc, "the truncated src is app relative")
  });
