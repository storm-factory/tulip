var test = require( 'tape' );
const notification = require('../../src/modules/notification.js');

test( 'Map glyph filename to _notification type', function( assert ) {
  // const notification = new Notification();
  assert.equal( notification.mapFileNameToType("waypoint-masked"), "wpm", 'Maps waypoint-masked to wpm' );
  assert.equal( notification.mapFileNameToType("waypoint-eclipsed"), "wpe", 'Maps waypoint-eclipsed to wpe' );
  assert.equal( notification.mapFileNameToType("waypoint-security"), "wps", 'Maps waypoint-security to wps' );
  // assert.equal( notification.mapFileNameToType("danger-3"), "wps", 'Maps danger-3 to wps' );
  assert.equal( notification.mapFileNameToType("start"), "dss", 'Maps start to dss' );
  assert.equal( notification.mapFileNameToType("finish"), "fss", 'Maps finish to fss' );
  assert.equal( notification.mapFileNameToType("control-arrival-selective-section"), "fss", 'Maps control-arrival-selective-section to fss' );
  assert.equal( notification.mapFileNameToType("speed-start"), "dsz", 'Maps speed-start to dsz' );
  assert.equal( notification.mapFileNameToType("speed-end"), "fsz", 'Maps speed-end to fsz' );

  assert.end();
} );

test('Checks file name against type', function(assert){
  assert.ok( notification.nameMatchesClass("waypoint-masked", "wpm"), 'Matches waypoint-masked with wpm' );
  assert.ok( notification.nameMatchesClass("waypoint-eclipsed", "wpe"), 'Matches waypoint-eclipsed with wpe' );
  assert.ok( notification.nameMatchesClass("waypoint-security", "wps"), 'Matches waypoint-security with wps' );
  // assert.ok( notification.nameMatchesClass("danger-3", "wps"), 'Matches danger-3 with wps' );
  assert.ok( notification.nameMatchesClass("start", "dss"), 'Matches start with dss' );
  assert.ok( notification.nameMatchesClass("finish", "fss"), 'Matches finish with fss' );
  assert.ok( notification.nameMatchesClass("control-arrival-selective-section", "fss"), 'Matches control-arrival-selective-section with fss' );
  assert.ok( notification.nameMatchesClass("speed-start", "dsz"), 'Matches speed-start with dsz' );
  assert.ok( notification.nameMatchesClass("speed-end", "fsz"), 'Matches speed-end with fsz' );

  assert.end();
});

test( 'Builds a WPM _notification type', function( assert ) {
  var _notification = notification.buildNotification('wpm');

  assert.equal(_notification.type, 'wpm', 'The type is correct');
  assert.equal(_notification.openRadius, 800, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 90, 'The validation radius is the right size');
  assert.end() ;
} );

test( 'Builds a WPE _notification type', function( assert ) {
  var _notification = notification.buildNotification('wpe');

  assert.equal(_notification.type, 'wpe', 'The type is correct');
  assert.equal(_notification.openRadius, 1000, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 90, 'The validation radius is the right number');

  assert.end() ;
} );

test( 'Builds a WPS _notification type', function( assert ) {
  var _notification = notification.buildNotification('wps');

  assert.equal(_notification.type, 'wps', 'The type is correct');
  assert.equal(_notification.openRadius, 1000, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 30, 'The validation radius is the right number');

  assert.end() ;
} );

test( 'Builds a DSS _notification type', function( assert ) {
  var _notification = notification.buildNotification('dss');

  assert.equal(_notification.type, 'dss', 'The type is correct');
  assert.equal(_notification.openRadius, 1000, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 200, 'The validation radius is the right number');

  assert.end() ;
} );

test( 'Builds a FSS _notification type', function( assert ) {
  var _notification = notification.buildNotification('fss');

  assert.equal(_notification.type, 'fss', 'The type is correct');
  assert.equal(_notification.openRadius, 800, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 90, 'The validation radius is the right number');

  assert.end() ;
} );

test( 'Builds a DSZ _notification type', function( assert ) {
  var _notification = notification.buildNotification('dsz');

  assert.equal(_notification.type, 'dsz', 'The type is correct');
  assert.equal(_notification.openRadius, 1000, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 90, 'The validation radius is the right number');

  assert.end() ;
} );

test( 'Builds a FSZ _notification type', function( assert ) {
  var _notification = notification.buildNotification('fsz');

  assert.equal(_notification.type, 'fsz', 'The type is correct');
  assert.equal(_notification.openRadius, 1000, 'The open radius is the right size');
  assert.equal(_notification.validationRadius, 90, 'The validation radius is the right size');

  assert.end() ;
} );
