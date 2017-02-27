var test = require( 'tape' );
var notifications = require('../../src/modules/notification.js');

test( 'Map glyph filename to notification type', function( assert ) {
  assert.equal( notifications.mapFileNameToType("waypoint-masked"), "wpm", 'Maps waypoint-masked to wpm' );
  assert.equal( notifications.mapFileNameToType("waypoint-eclipsed"), "wpe", 'Maps waypoint-eclipsed to wpe' );
  assert.equal( notifications.mapFileNameToType("waypoint-safety"), "wps", 'Maps waypoint-safety to wps' );
  assert.equal( notifications.mapFileNameToType("danger-3"), "wps", 'Maps danger-3 to wps' );
  assert.equal( notifications.mapFileNameToType("start"), "dss", 'Maps start to dss' );
  assert.equal( notifications.mapFileNameToType("finish"), "fss", 'Maps finish to fss' );
  assert.equal( notifications.mapFileNameToType("finish-of-selective-section"), "fss", 'Maps finish-of-selective-section to fss' );
  assert.equal( notifications.mapFileNameToType("speed-start"), "dsz", 'Maps speed-start to dsz' );
  assert.equal( notifications.mapFileNameToType("speed-end"), "fsz", 'Maps speed-end to fsz' );

  assert.end();
} );

test( 'Builds a WPM notification type', function( assert ) {
  var notification = notifications.buildNotification('wpm');

  assert.equal(notification.type, 'wpm', 'The type is correct');
  assert.equal(notification.bubble, 400, 'The bubble is the right size');
  assert.equal(notification.modifier, 400, 'The modifier is the right size');
  assert.end() ;
} );

test( 'Builds a WPE notification type', function( assert ) {
  var notification = notifications.buildNotification('wpe');

  assert.equal(notification.type, 'wpe', 'The type is correct');
  assert.equal(notification.bubble, 50, 'The bubble is the right size');
  assert.equal(notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );

test( 'Builds a WPS notification type', function( assert ) {
  var notification = notifications.buildNotification('wps');

  assert.equal(notification.type, 'wps', 'The type is correct');
  assert.equal(notification.bubble, 200, 'The bubble is the right size');
  assert.equal(notification.modifier, 200, 'The modifier is the right number');

  assert.end() ;
} );

test( 'Builds a DSS notification type', function( assert ) {
  var notification = notifications.buildNotification('dss');

  assert.equal(notification.type, 'dss', 'The type is correct');
  assert.equal(notification.bubble, 50, 'The bubble is the right size');
  assert.equal(notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );

test( 'Builds a FSS notification type', function( assert ) {
  var notification = notifications.buildNotification('fss');

  assert.equal(notification.type, 'ass', 'The type is correct');
  assert.equal(notification.bubble, 50, 'The bubble is the right size');
  assert.equal(notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );

test( 'Builds a DSZ notification type', function( assert ) {
  var notification = notifications.buildNotification('dsz');

  assert.equal(notification.type, 'dsz', 'The type is correct');
  assert.equal(notification.bubble, 200, 'The bubble is the right size');
  assert.equal(notification.modifier, 0, 'The modifier is the right number');

  assert.end() ;
} );

test( 'Builds a FSZ notification type', function( assert ) {
  var notification = notifications.buildNotification('fsz');

  assert.equal(notification.type, 'fsz', 'The type is correct');
  assert.equal(notification.bubble, 50, 'The bubble is the right size');
  assert.equal(notification.modifier, undefined, 'There is no modifier');

  assert.end() ;
} );
