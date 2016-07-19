QUnit.module( "Tulip", function() {
  QUnit.test("Tulip Create", function( assert ) {
    assert.expect(0);
  });

  QUnit.test("Describe Create From JSON", function( assert ) {
    assert.expect(0);
  });

  QUnit.test("Describe Change Exit Angle", function( assert ) {

    var tulip = new Tulip($('canvas')[0], 45, {entryTrackType: 'track', exitTrackType: 'track'}, null);

    var beforePath = $(tulip.exitTrack.toSVG());

    assert.equal($(tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 96 84 103 77 109 71 C 115 65 122 58 128 52 C 135 45 141 39 147 33", "It intializes the path to 45");

    tulip.changeExitAngle(100);
    assert.equal($(tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 99 92 108 93 117 95 C 125 96 134 98 143 99 C 152 101 161 103 170 104", "It changes the path to 100");
    assert.notEqual(tulip.exitTrack.toSVG(),beforePath, "The 45 and 100 path strings are not the same");

    tulip.exitTrackChanged = true;
    tulip.changeExitAngle(45);
    assert.notEqual($(tulip.exitTrack.toSVG()).attr('d'), "M 90 90 C 96 84 103 77 109 71 C 115 65 122 58 128 52 C 135 45 141 39 147 33", "It won't change the angle if the exitTrack has been changed");
    //we need to validate the point of the exit end and all intermediate points are correctly translated
    // console.log($(tulip.exitTrack.toSVG()));


  });

  // NOTE: we'll need this for path string test
  // tulip.exitTrack.path[1][1] == 99
  // tulip.exitTrack.path[1][2] == 92
  // tulip.exitTrack.path[1][3] == 108
  // tulip.exitTrack.path[1][4] == 93
  // tulip.exitTrack.path[1][5] == 117
  // tulip.exitTrack.path[1][6] == 95

  // tulip.exitTrack.path[1][1] == 125
  // tulip.exitTrack.path[1][2] == 96
  // tulip.exitTrack.path[1][3] == 134
  // tulip.exitTrack.path[1][4] == 98
  // tulip.exitTrack.path[1][5] == 143
  // tulip.exitTrack.path[1][6] == 99

  // tulip.exitTrack.path[1][1] == 152
  // tulip.exitTrack.path[1][2] == 101
  // tulip.exitTrack.path[1][3] == 161
  // tulip.exitTrack.path[1][4] == 103
  // tulip.exitTrack.path[1][5] == 170
  // tulip.exitTrack.path[1][6] == 104
});
