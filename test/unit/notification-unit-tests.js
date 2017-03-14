var test = require( 'tape' );
var notification = require('../../src/modules/notification.js');

test( 'Map glyph filename to _notification type', function( assert ) {
  assert.equal( notification.mapFileNameToType("waypoint-masked"), "wpm", 'Maps waypoint-masked to wpm' );
  assert.equal( notification.mapFileNameToType("waypoint-eclipsed"), "wpe", 'Maps waypoint-eclipsed to wpe' );
  assert.equal( notification.mapFileNameToType("waypoint-safety"), "wps", 'Maps waypoint-safety to wps' );
  assert.equal( notification.mapFileNameToType("danger-3"), "wps", 'Maps danger-3 to wps' );
  assert.equal( notification.mapFileNameToType("start"), "dss", 'Maps start to dss' );
  assert.equal( notification.mapFileNameToType("finish"), "fss", 'Maps finish to fss' );
  assert.equal( notification.mapFileNameToType("finish-of-selective-section"), "fss", 'Maps finish-of-selective-section to fss' );
  assert.equal( notification.mapFileNameToType("speed-start"), "dsz", 'Maps speed-start to dsz' );
  assert.equal( notification.mapFileNameToType("speed-end"), "fsz", 'Maps speed-end to fsz' );

  assert.end();
} );

test('Checks file name against type', function(assert){
  assert.ok( notification.nameMatchesClass("waypoint-masked", "wpm"), 'Matches waypoint-masked with wpm' );
  assert.ok( notification.nameMatchesClass("waypoint-eclipsed", "wpe"), 'Matches waypoint-eclipsed with wpe' );
  assert.ok( notification.nameMatchesClass("waypoint-safety", "wps"), 'Matches waypoint-safety with wps' );
  assert.ok( notification.nameMatchesClass("danger-3", "wps"), 'Matches danger-3 with wps' );
  assert.ok( notification.nameMatchesClass("start", "dss"), 'Matches start with dss' );
  assert.ok( notification.nameMatchesClass("finish", "fss"), 'Matches finish with fss' );
  assert.ok( notification.nameMatchesClass("finish-of-selective-section", "fss"), 'Matches finish-of-selective-section with fss' );
  assert.ok( notification.nameMatchesClass("speed-start", "dsz"), 'Matches speed-start with dsz' );
  assert.ok( notification.nameMatchesClass("speed-end", "fsz"), 'Matches speed-end with fsz' );

  assert.end();
});

test( 'Builds a WPM _notification type', function( assert ) {
  var _notification = notification.buildNotification('wpm');

  assert.equal(_notification.type, 'wpm', 'The type is correct');
  assert.equal(_notification.bubble, 400, 'The bubble is the right size');
  assert.equal(_notification.modifier, 400, 'The modifier is the right size');
  assert.end() ;
} );

test( 'Builds a WPE _notification type', function( assert ) {
  var _notification = notification.buildNotification('wpe');

  assert.equal(_notification.type, 'wpe', 'The type is correct');
  assert.equal(_notification.bubble, 50, 'The bubble is the right size');
  assert.equal(_notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );

test( 'Builds a WPS _notification type', function( assert ) {
  var _notification = notification.buildNotification('wps');

  assert.equal(_notification.type, 'wps', 'The type is correct');
  assert.equal(_notification.bubble, 200, 'The bubble is the right size');
  assert.equal(_notification.modifier, 200, 'The modifier is the right number');

  assert.end() ;
} );

test( 'Builds a DSS _notification type', function( assert ) {
  var _notification = notification.buildNotification('dss');

  assert.equal(_notification.type, 'dss', 'The type is correct');
  assert.equal(_notification.bubble, 50, 'The bubble is the right size');
  assert.equal(_notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );

test( 'Builds a FSS _notification type', function( assert ) {
  var _notification = notification.buildNotification('fss');

  assert.equal(_notification.type, 'fss', 'The type is correct');
  assert.equal(_notification.bubble, 50, 'The bubble is the right size');
  assert.equal(_notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );

test( 'Builds a DSZ _notification type', function( assert ) {
  var _notification = notification.buildNotification('dsz');

  assert.equal(_notification.type, 'dsz', 'The type is correct');
  assert.equal(_notification.bubble, 200, 'The bubble is the right size');
  assert.equal(_notification.modifier, 5, 'The modifier is the right number');

  assert.end() ;
} );

test( 'Builds a FSZ _notification type', function( assert ) {
  var _notification = notification.buildNotification('fsz');

  assert.equal(_notification.type, 'fsz', 'The type is correct');
  assert.equal(_notification.bubble, 50, 'The bubble is the right size');
  assert.equal(_notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );
