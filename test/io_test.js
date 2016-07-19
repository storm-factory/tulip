QUnit.module( "IO", function() {
  var gpx = "<?xml version='1.0' encoding='UTF-8'?><gpx xmlns='http://www.topografix.com/GPX/1/1' version='1.1' creator='Tulip' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd http://www.topografix.com/GPX/Private/TopoGrafix/0/4 http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd'><wpt lat='37.29337270932911' lon='-107.88106575608253'><name>0</name></wpt><wpt lat='37.29309637989143' lon='-107.88188248872757'><name>1</name></wpt><wpt lat='37.290920916939406' lon='-107.88114622235298'><name>2</name></wpt><wpt lat='37.29155254385536' lon='-107.884840965271'><name>3</name></wpt><wpt lat='37.28981982490677' lon='-107.88479804992676'><name>4</name></wpt><wpt lat='37.28754076927477' lon='-107.88665413856506'><name>5</name></wpt><trk><trkseg><trkpt lat='37.29337270932911' lon='-107.88106575608253'></trkpt><trkpt lat='37.29309637989143' lon='-107.88188248872757'></trkpt><trkpt lat='37.292407152237836' lon='-107.88155794143677'></trkpt><trkpt lat='37.29189502853012' lon='-107.88126692175865'></trkpt><trkpt lat='37.29148319318627' lon='-107.88117170333862'></trkpt><trkpt lat='37.290920916939406' lon='-107.88114622235298'></trkpt><trkpt lat='37.29102654410709' lon='-107.88207694888115'></trkpt><trkpt lat='37.29118345577999' lon='-107.88293800097983'></trkpt><trkpt lat='37.291295004792694' lon='-107.88398158978043'></trkpt><trkpt lat='37.29155254385536' lon='-107.884840965271'></trkpt><trkpt lat='37.28981982490677' lon='-107.88479804992676'></trkpt><trkpt lat='37.28953406449588' lon='-107.88543236352183'></trkpt><trkpt lat='37.28889619722493' lon='-107.88562540238127'></trkpt><trkpt lat='37.28754076927477' lon='-107.88665413856506'></trkpt></trkseg></trk></gpx>"

  QUnit.test("Describe ParseGpxTracksToArray", function( assert ) {
      var io = new Io();
      var tracks = $.makeArray($(gpx).find( "trkpt" ));

      assert.ok(io.parseGpxTracksToArray(tracks) instanceof Array, "It returns array");
      assert.equal(Object.keys(io.parseGpxTracksToArray(tracks)[0])[0], "lat", "It returns array with lat key");
      assert.equal(Object.keys(io.parseGpxTracksToArray(tracks)[0])[1], "lng", "It returns array with lng key");
      assert.equal(io.parseGpxTracksToArray(tracks).length, 14, "It returns an array with all the tracks");
  });

  QUnit.test("Describe ProcessGpxTracksForImport", function( assert ) {
      var io = new Io();
      var tracks = $.makeArray($(gpx).find( "trkpt" ));

      assert.ok(io.processGpxTracksForImport(tracks) instanceof Array, "It returns array");
      assert.ok(io.processGpxTracksForImport(tracks).length < io.parseGpxTracksToArray(tracks).length, "It reduces the number of points in the track");
      assert.equal(Object.keys(io.processGpxTracksForImport(tracks)[0])[0], "lat", "It returns array with lat key");
      assert.equal(Object.keys(io.processGpxTracksForImport(tracks)[0])[1], "lng", "It returns array with lng key");
  });

  QUnit.test("Describe WaypointSharesTrackpoint", function( assert ) {
      var io = new Io();
      var tracks = $.makeArray($(gpx).find( "trkpt" ));
      io.processGpxTracksForImport(tracks)
      var waypoint = "<wpt lat='" + io.tracks[2].lat + "' lon='" + io.tracks[2].lng + "'><name>5</name></wpt>"

      assert.equal(io.waypointSharesTrackpoint(waypoint), 2, "It returns the index of the trackpoint if a waypoint and trackpoint share a lat long");

      waypoint = "<wpt lat='123.456' lon='789.101112'><name>5</name></wpt>"
      assert.equal(io.waypointSharesTrackpoint(waypoint), -1, "It returns the -1 if a waypoint and trackpoint do not share a lat long");
  });


  /*
    NOTE what this section shows is that we need a way to refresh the app
    this should be able to be two seperate tests
  */

  QUnit.test("Describe ImportGPX --> ExportGPX", function( assert ) {

    assert.expect(0);
    // app.io.importGPX(gpx);
    //
    // assert.equal(app.roadbook.waypoints().length, 6, "It imports waypoints into roadbook")
    // assert.equal(app.mapEditor.routeMarkers.length, 10, "It imports points onto map")
    //
    // var gpxString = app.io.exportGPX();
    //
    // assert.equal($.makeArray($(gpxString).find( "wpt" )).length, 6, "It exports all waypoints into gpx")
    // assert.equal($.makeArray($(gpxString).find( "trkpt" )).length, 10, "It exports all trackpoints into gpx")
  });
});
