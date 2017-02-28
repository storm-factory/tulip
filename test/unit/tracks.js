var test = require( 'tape' );
var tracks = require('../../src/modules/tracks.js');


test( 'Builds a track path string when given an angle', function( assert ) {
  var track = new tracks.track();
  var string = "M 90 90 C 96, 84, 103, 77, 109, 71 C 115, 65, 122, 58, 128, 52 C 135, 45, 141, 39, 147, 33";
  assert.equal( track.buildTrackPathString(45,[90,90]), string, "Creates an accurate SVG string when given an angle" );

  assert.end();
});

test( 'Builds a track path set given an array of maginitudes, an angle, and origin', function( assert ) {
  var track = new tracks.track();
  var set = track.buildTrackPathsSet([9,18],45,[90,90]);

  assert.equal(set[0][0], 96, "It rotates the first X component of the magnitude about the origin");
  assert.equal(set[0][1], 84, "It rotates the first Y component of the magnitude about the origin");
  assert.equal(set[1][0], 103, "It rotates the second X component of the magnitude about the origin");
  assert.equal(set[1][1], 77, "It rotates the second Y component of the magnitude about the origin");

  assert.end();
});

test( 'Builds rotates a point about an origin', function( assert ) {
  var track = new tracks.track();
  var set = track.rotatePoint(9,45,[90,90]);

  assert.equal(set[0], 96, "It rotates the first X component of the magnitude about the origin");
  assert.equal(set[1], 84, "It rotates the first Y component of the magnitude about the origin");

  assert.end();
});

test('Builds a propperly stubbed hp type', function(assert){
  var track = new tracks.track();
  var hp = track.types['offPiste'];

  var validHP = [{
                      fill: '',
                      stroke: '#000',
                      strokeWidth: 4,
                      strokeDashArray: [10, 5],
                      hasControls: false,
                      lockMovementX: true,
                      lockMovementY: true,
                      hasBorders: false,
                      selectable:false,
                    }];
  assert.deepLooseEqual(validHP,hp, "It creates a propperly formatted hp type object");
  assert.end();
});

test('Builds a propperly stubbed track type', function(assert){
  var track = new tracks.track();
      track = track.types['track'];

  var validTrack = [{
                      fill: '',
                      stroke: '#000',
                      strokeWidth: 4,
                      strokeDashArray: [],
                      hasControls: false,
                      lockMovementX: true,
                      lockMovementY: true,
                      hasBorders: false,
                      selectable:false,
                    }];
  assert.deepLooseEqual(validTrack,track, "It creates a propperly formatted track type object");
  assert.end();
});

test('Builds a propperly stubbed road type', function(assert){
  var track = new tracks.track();
  var road = track.types['road'];

  var validRoad = [{
                      fill: '',
                      stroke: '#000',
                      strokeWidth: 6,
                      strokeDashArray: [],
                      hasControls: false,
                      lockMovementX: true,
                      lockMovementY: true,
                      hasBorders: false,
                      selectable:false,
                    }];
  assert.deepLooseEqual(validRoad,road, "It creates a propperly formatted road type object");
  assert.end();
});

test('Builds a propperly stubbed main road type', function(assert){
  var track = new tracks.track();
  var mainRoad = track.types['mainRoad'];

  var validMainRoad = [{
                        fill: '',
                        stroke: '#000',
                        strokeWidth: 6,
                        strokeDashArray: [],
                        hasControls: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        hasBorders: false,
                        selectable:false,
                      },
                      {
                        fill: '',
                        stroke: '#fff',
                        strokeWidth: 4,
                        strokeDashArray: [],
                        hasControls: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        hasBorders: false,
                        selectable:false,
                      }];
  assert.deepLooseEqual(validMainRoad,mainRoad, "It creates a propperly formatted mainRoad type object");
  assert.end();
});

test('Builds a propperly stubbed dcw type', function(assert){
  var track = new tracks.track();
  var dcw = track.types['dcw'];

  var validDCW = [{
                    fill: '',
                    stroke: '#000',
                    strokeWidth: 10,
                    strokeDashArray: [],
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    hasBorders: false,
                    selectable:false,
                  },
                  {
                    fill: '',
                    stroke: '#fff',
                    strokeWidth: 8,
                    strokeDashArray: [],
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    hasBorders: false,
                    selectable:false,
                  },
                  {
                    fill: '',
                    stroke: '#000',
                    strokeWidth: 2,
                    strokeDashArray: [],
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    hasBorders: false,
                    selectable:false,
                  }];
  assert.deepLooseEqual(validDCW,dcw, "It creates a propperly formatted dcw type object");
  assert.end();
});
