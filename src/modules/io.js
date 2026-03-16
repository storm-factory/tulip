// TODO This is a module that only interfaces with the app, refactor to make that the only coupling
var Io = Class({

  importGPX: function (gpx) {
    try {
      var gpxDoc = $.parseXML(gpx.trim());
      this.gpx = $(gpxDoc);
    } catch (e) {
      globalNode.dialog().showMessageBoxSync({
        message: "Error parsing GPX :-(",
        type: 'error',
        buttons: ['OK']
      });
      app.stopLoading();
      return;
    }

    var name,desc;
    // Find name and description from route/track
    this.gpx.find('trk').each(function () {
      const $trk = $(this);
      name= $trk.find('name').text() || false
      desc = $trk.find('desc').text() || false
    });

    if (! (name || desc)) {
      this.gpx.find('rte').each(function () {
        const $rte = $(this);
        name= $rte.find('name').text() || false
        desc = $rte.find('desc').text() || false
      });
    }

    if (app.roadbook.name() == 'Name your roadbook')
        app.roadbook.name(name || "GPX Import");
    if (app.roadbook.desc() == 'Describe your roadbook' && desc !== false)
        app.roadbook.desc(desc);

    // Load track points and fallback to route points
    path = this.gpx.find("trkpt");
    if (path.length == 0) {
      globalNode.dialog().showMessageBoxSync({
        message: "No track is found, trying to load route",
        type: 'warning',
        buttons: ['Continue']
      });
      path = this.gpx.find("rtept")
    }
    // Fallback to just waypoints
    if (path.length == 0) {
      globalNode.dialog().showMessageBoxSync({
        message: "No track or route is found, trying to load waypoints",
        type: 'warning',
        buttons: ['Continue']
      });
      path = this.gpx.find("wpt");
    }

    if (path.length == 0) {
      globalNode.dialog().showMessageBoxSync({
        message: "No usable points found, aborting",
        type: 'error',
        buttons: ['OK']
      });
      return;
    }

    this.importGPXTracks($.makeArray(path));
    this.importGPXWaypoints($.makeArray(this.gpx.find("wpt")));
    this.roadbookHasWaypoints();
    app.mapModel.updateRoadbookAndInstructions();
  },

  addWaypoint: function (marker) {
    if (marker) {
      app.mapModel.addInstruction(marker);
    }
  },

  roadbookHasWaypoints() {
    if (app.mapModel.markers[0].instruction == null) {
      this.addWaypoint(app.mapModel.markers[0]);
    }
    // TODO abstract this to the app
    if (app.mapModel.markers[(app.mapModel.markers.length - 1)].instruction == null) {
      this.addWaypoint(app.mapModel.markers[(app.mapModel.markers.length - 1)]);
    }

  },

  // TODO DRY this up
  exportGPX: function () {
    var gpxString = "<?xml version='1.0' encoding='UTF-8'?>";
    gpxString += "<gpx xmlns='http://www.topografix.com/GPX/1/1' version='1.1' creator='Tulip' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd http://www.topografix.com/GPX/Private/TopoGrafix/0/4 http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd'>";
    var waypoints = "";
    var trackPoints = "<trk><trkseg>";
    // TODO abstract this to the app
    var points = app.mapModel.markers;
    var wptCount = 1;
    for (var i = 0; i < points.length; i++) {
      if (points[i].instruction) {
        var name = this.buildNameString(wptCount, points[i].instruction);
        var desc = this.buildDescString(wptCount, points[i].instruction);
        var waypoint = "<wpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'><name>" + name + "</name><desc>" + desc + "</desc></wpt>";
        waypoints += waypoint;
        wptCount++;
      }
      var trackPoint = "<trkpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'></trkpt>"
      trackPoints += trackPoint;
    }
    trackPoints += "</trkseg></trk>";
    gpxString += waypoints;
    gpxString += trackPoints;
    gpxString += "</gpx>";

    return gpxString;
  },
  // TODO DRY this up
  exportOpenRallyGPX: function (strict) {
    // Create a new XML document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString('<?xml version="1.0" encoding="UTF-8"?><gpx></gpx>', 'application/xml');

    // Get the root element
    const root = xmlDoc.getElementsByTagName('gpx')[0];
    root.setAttribute('xmlns', 'http://www.topografix.com/GPX/1/1');
    root.setAttribute('creator', 'Tulip ' + globalNode.getVersion() + " - https://gitlab.com/drid/tulip");
    root.setAttribute('version', '1.1');
    root.setAttribute('xmlns:openrally', 'http://www.openrally.org/xmlschemas/GpxExtensions/v1.0.3');
    root.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    root.setAttribute('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1\
       http://www.topografix.com/GPX/1/1/gpx.xsd\
       http://www.topografix.com/GPX/gpx_style/0/2\
       http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd\
       http://www.topografix.com/GPX/gpx_overlay/0/3\
       http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd\
       http://www.topografix.com/GPX/gpx_modified/0/1\
       http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd\
       http://www.topografix.com/GPX/Private/TopoGrafix/0/4\
       http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd');

    // Metadata
    var element = xmlDoc.createElement('metadata');
    var extensions = xmlDoc.createElement('extensions');
    var child = xmlDoc.createElement('openrally:units');
    child.textContent = 'metric';
    extensions.appendChild(child);

    child = xmlDoc.createElement('openrally:distance');
    child.textContent = app.roadbook.totalDistance();
    extensions.appendChild(child);
    element.appendChild(extensions);
    root.appendChild(element);

    // Waypoints and tracks
    const tracks = xmlDoc.createElement('trk');
    tracks.appendChild(xmlDoc.createElement("name")).textContent = app.roadbook.name();
    const trkseg = xmlDoc.createElement("trkseg");

    // TODO abstract this to the app
    var points = app.mapModel.markers;
    var instCount = 1;
    for (var i = 0; i < points.length; i++) {
      if (points[i].instruction) {
        var waypoint = xmlDoc.createElement('wpt');
        waypoint.setAttribute('lat', points[i].getPosition().lat());
        waypoint.setAttribute('lon', points[i].getPosition().lng());
        waypoint.appendChild(xmlDoc.createElement("name")).textContent = instCount++;
        var desc = xmlDoc.createElement('desc');
        desc.textContent = "";
        waypoint.appendChild(desc);
        waypoint.appendChild(this.buildOpenRallyExtensionsString(xmlDoc, points[i].instruction, strict));
        root.appendChild(waypoint);
      }
      // Tracks
      var trkpt = xmlDoc.createElement("trkpt")
      trkpt.setAttribute('lat', points[i].getPosition().lat());
      trkpt.setAttribute('lon', points[i].getPosition().lng());
      trkseg.appendChild(trkpt);
    }

    tracks.appendChild(trkseg);
    root.appendChild(tracks);

    // Create XML string
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    return this.prettyPrintXML(xmlString);
  },

  /*
    OpenRally enhanced GPX format... route metadata without overriding GPX user-land variables.
    strict: Comply with openrally 1.0.2 or follow unpublished changes
  */
  buildOpenRallyExtensionsString: function (xmlDoc, waypoint, strict=false) {

    extensions = xmlDoc.createElement('extensions');
    distance = xmlDoc.createElement('openrally:distance');
    distance.textContent = (waypoint.kmFromStart() - waypoint.resetDistance());
    extensions.appendChild(distance);

    const tulipCdata = xmlDoc.createCDATASection(waypoint.tulip.toPNG());
    extensions.appendChild(xmlDoc.createElement('openrally:tulip')).appendChild(tulipCdata);
    const noteCdata = xmlDoc.createCDATASection(waypoint.note.toPNG());
    extensions.appendChild(xmlDoc.createElement('openrally:notes')).appendChild(noteCdata);

    if (waypoint.showCoordinates())
      extensions.appendChild(xmlDoc.createElement('openrally:show_coordinates'))
    if (waypoint.hasResetGlyph())
      extensions.appendChild(xmlDoc.createElement('openrally:reset'))
    if (waypoint.hasFuelGlyph())
      extensions.appendChild(xmlDoc.createElement('openrally:fuel'))
    if (waypoint.dangerLevel() > 0)
      extensions.appendChild(xmlDoc.createElement('openrally:danger')).textContent = waypoint.dangerLevel();
    if (waypoint.showHeading())
      extensions.appendChild(xmlDoc.createElement('openrally:cap')).textContent = Math.round(waypoint.exactHeading());
    if (waypoint.speedLimit())
      extensions.appendChild(xmlDoc.createElement('openrally:speed')).textContent = waypoint.speedLimit();
    if (waypoint.hasTimedStop())
      extensions.appendChild(xmlDoc.createElement('openrally:stop')).textContent = waypoint.stopTimeSec();
    for (tag of waypoint.safetyTags()) {
      extensions.appendChild(xmlDoc.createElement('openrally:'+tag));
    }
    // Notification
    if (waypoint.notification && waypoint.notification.openrallytype) {
      notification = xmlDoc.createElement("openrally:" + waypoint.notification.openrallytype);
      this.setWaypointXMLAttributes(notification, waypoint);
      if (waypoint.notification.openrallytype == ('neutralization')) {
        if (strict) {
          notification.removeAttribute('open');
          notification.removeAttribute('clear');
        }
        notification.removeAttribute('time');
        notification.textContent = waypoint.notification.time;
      }
      extensions.appendChild(notification);

      // Gracefully close zones
      if (['ft', 'fn'].includes(waypoint.notification.openrallytype) && waypoint.inSpeedZone()) {
        console.log(waypoint)
        extra_z = xmlDoc.createElement('openrally:fz');
        extensions.appendChild(extra_z);
      }

      // Add speed limit modifier
      if (['dns', 'dts'].includes(waypoint.notification.type)) {
        extra_z = xmlDoc.createElement('openrally:dz');
        extra_z.removeAttribute('time');
        extensions.appendChild(extra_z);
      }

      // Remove time from dt when strict
      if (waypoint.notification.openrallytype == 'dt' && strict)
        notification.removeAttribute('time');
    }
    return extensions;
  },

  setWaypointXMLAttributes: function (notification, waypoint) {
    if (waypoint.notification.openRadius) {
      notification.setAttribute("open", waypoint.notification.openRadius);
    }

    if (waypoint.notification.validationRadius) {
      notification.setAttribute("clear", waypoint.notification.validationRadius);
    }

    if (waypoint.notification.time) {
      notification.setAttribute("time", waypoint.notification.time);
    }

    if (waypoint.notification.waypointNumber) {
      notification.setAttribute("name", waypoint.waypointNumber());
    }
  },

  /*
    New rally blitz and rally comp format notification
  */
  buildNameString: function (count, waypoint) {
    var string;
    if (waypoint.notification) {
      var type = waypoint.notification.type
      type = (type == "wpm" ? type + count : type).toUpperCase();
      var dist = type == "wpm" ? ":" + waypoint.kmFromStart().toFixed(2) : "";
      var validationRadius = waypoint.notification.validationRadius ? ":" + waypoint.notification.validationRadius : ""
      string = type + validationRadius + dist;
    } else {
      string = count;
    }
    return string;
  },
  /*
    legacy rally blitz notification
  */
  buildDescString: function (count, waypoint) {
    var string = "";
    if (waypoint.notification) {
      var type = waypoint.notification.type
      // TODO Speed Zone
      string = (type == "wpm" ? "WP" + count : (type == "wps" ? "!!!" : (type == "dsz" ? "SZ" + waypoint.notification.validationRadius : "")));
    }
    return string;
  },

  importGPXTracks: function (tracks) {
    if (tracks.length > 0) {
      var tracks = this.processGpxTracksForImport(tracks);

      for (var i = 0; i < tracks.length; i++) {

        var latLng = new google.maps.LatLng(tracks[i].lat, tracks[i].lng);
        // TODO abstract this to the app
        app.mapController.addRoutePoint(latLng);
      }

      var latLng = new google.maps.LatLng(tracks[0].lat, tracks[0].lng);
      app.mapController.setMapCenter(latLng);
      app.mapController.setMapZoom(14);
    }
  },


  importGPXWaypoints: function (waypoints) {
    //logic to import into roadbook
    if (waypoints.length > 0) {
      for (waypoint of waypoints) {
        var index = this.waypointSharesTrackpoint(waypoint);

        if (index == -1) {
          var latLng = new google.maps.LatLng($(waypoint).attr('lat'), $(waypoint).attr('lon'));
          index = app.mapController.insertLatLngIntoRoute(latLng);
        }

        if (index !== undefined) {
          this.addWaypoint(app.mapModel.markers[index]);
        }
      }
    }
  },


  parseGpxTracksToArray: function (gpxTracks) {
    var tracks = []
    for (var i = 0; i < gpxTracks.length; i++) {
      var point = { lat: parseFloat($(gpxTracks[i]).attr('lat')), lng: parseFloat($(gpxTracks[i]).attr('lon')) }
      tracks.push(point);
    }
    return tracks;
  },

  processGpxTracksForImport: function (tracks) {
    this.tracks = this.parseGpxTracksToArray(tracks);
    var simplify = new Simplify();
    this.tracks = simplify.simplifyDouglasPeucker(this.tracks, 7e-9);
    return this.tracks;
  },

  /*
    try to think of a more efficient way to do this
  */
  waypointSharesTrackpoint: function (waypoint) {
    var tracks = this.tracks;
    var index = -1;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].lat == parseFloat($(waypoint).attr('lat')) && tracks[i].lng == parseFloat($(waypoint).attr('lon'))) {
        index = i;
        break;
      }
    }

    return index;
  },

  prettyPrintXML: function (xml) {
    let formatted = '', indent = '';
    const tab = '  '; // 2 spaces for indentation
    xml.split(/>\s*</).forEach(node => {
      if (node.startsWith("<?xml")) {
        formatted += `${node}>\n`;
        return;
      }
      if (node.match(/^\/\w/)) indent = indent.slice(tab.length); // Decrease indent for closing tags
      formatted += `${indent}<${node}>\n`;
      if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab; // Increase indent for opening tags
    });
    return formatted.slice(0, -2); // Remove trailing newline
  }
});
