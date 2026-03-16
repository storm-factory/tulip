/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
  // TODO separate into tulip model and tulip controller to separate UI interaction from state the tulip canvas would be the view
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

class Tulip extends InstructionCanvas {

  constructor(el, angle, trackTypes, json) {
    super(el);
    this.selectedTrackId = null;

    this.tracks = [];
    this.activeEditors = [];
    this.addedTrackType = 'track';
    // TODO should this be checking JSON for this?
    this.exitTrackEdited = false;
    this.markerAngle = 45;
    this.initTulip(angle, trackTypes, json);
  }

  clear() {
    super.clear();
    this.entryTrack = null;
    this.entryTrackOrigin = null;
    this.exitTrack = null;
    this.exitTrackEnd = null;
  }

  /*
    Creates a tulip either from passed in json from a file load or from a angle provided by UI wpt creation
  */
  initTulip(angle, trackTypes, json) {
    if (json !== undefined && angle == undefined) { //the map point has been created from serialized json
      if (json.markerAngle)
        this.markerAngle = json.markerAngle;
      this.buildFromJson(json, trackTypes);
    } else if (angle !== undefined && trackTypes !== undefined) {
      this.initEntry(trackTypes.entryTrackType);
      this.initExit(angle, trackTypes.exitTrackType);
      // Add km marker
      this.addKmMarker(this.markerAngle);
    }
  }

  setupEventListeners() {
    var _this = this;
    this.canvas.on('object:moving', function (e) {
      // NOTE I do not like this dependency
      if (e.target.editor) {
        if (e.target.editor.track instanceof ExitTrack && !_this.exitTrackEdited) {
          _this.exitTrackEdited = true;
        }
        e.target.editor.pointMoving(e.target);
      }
    });
    this.canvas.on('mouse:down', (options) => {
      if (options.target && options.target.type && options.target.type == "path" && options.target.selectable) {
        try {
          _this.addTrackHandles(options);
        } catch (error) {
          console.log(error);
          return;
        }
        _this.selectedTrackId = options.target.id;
      }
      if (options.target === undefined) {
        _this.selectedTrackId = null;
        app.roadbook.canvasSelectedItemType(null);
        _this.removeTrackHandles();
      }
    });

    // this.canvas.on('object:selected', (options) => {
    //   app.roadbook.canvasSelectedItemType(options.target?.type || null);
    // })

    // TODO: this is a hack for fabric 1.5  
    this.canvas.on('object:modified', function (options) {
      var obj = options.target;
      if (obj.editor instanceof AddedTrackEditor) {
        var bbTop = Math.min(obj.editor.originHandle.top, obj.editor.endHandle.top, obj.editor.joinOneHandle.top, obj.editor.joinTwoHandle.top);
        var bbLeft = Math.min(obj.editor.originHandle.left, obj.editor.endHandle.left, obj.editor.joinOneHandle.left, obj.editor.joinTwoHandle.left);
        var bbBottom = Math.max(obj.editor.originHandle.top, obj.editor.endHandle.top, obj.editor.joinOneHandle.top, obj.editor.joinTwoHandle.top);
        var bbRight = Math.max(obj.editor.originHandle.left, obj.editor.endHandle.left, obj.editor.joinOneHandle.left, obj.editor.joinTwoHandle.left);
        var bbHeight = Math.abs(bbTop - bbBottom);
        var bbWidth = Math.abs(bbLeft - bbRight);
        for (let index = 0; index < obj.editor.paths.length; index++) {
          obj.editor.paths[index].top = bbTop + bbHeight / 2;
          obj.editor.paths[index].left = bbLeft + bbWidth / 2;
          obj.editor.paths[index].height = bbHeight;
          obj.editor.paths[index].width = bbWidth;
          obj.editor.paths[index].pathOffset.x = bbLeft + bbWidth / 2;
          obj.editor.paths[index].pathOffset.y = bbTop + bbHeight / 2;
          obj.editor.paths[index].setCoords();
        }
      }
    });
  }

  initEntry(trackType) {
    this.entryTrack = new EntryTrack(trackType, this.canvas);
  }

  initExit(angle, trackType) {
    this.exitTrack = new ExitTrack(angle, trackType, this.canvas);
  }

  initTracks(trackArray) {
    for (var i = 0; i < trackArray.length; i++) {
      this.tracks.push(new AddedTrack(null, null, null, { track: [trackArray[i]] }))
    }
  }

  /*
    Adds a track to tulip from UI interaction
  */
  addTrack(angle) {
    this.finishRemove();
    var track = new AddedTrack(angle, this.addedTrackType, this.canvas)
    // track.paths[0].on('mousedown', function(e) {
    //   console.log('Clicked on path!', e);
    // });
    this.tracks.push(track);

    //NOTE this solves the problem of having overlapping handles if a control is clicked twice or things get too close to one another.
    //     an alternate solution that may solve any performance issues this might cause is to loop through the active editors and bring all the
    //     handles to the front.
    this.finishEdit();
    this.beginEdit();
  }

  /*
    Builds the tulip from passed in JSON
  */
  // NOTE this is going to have to handle legacy data structure and translate it into new style
  buildFromJson(json, trackTypes) {
    this.exitTrackEdited = json.exitTrackEdited !== undefined ? json.exitTrackEdited : false;
    var _this = this;
    /*
      Default Tracks
      */
    if (json.entry.path && json.exit.path) {
      // NOTE this will handle legacy track structure but they need to be converted
      this.loadOldTrackFormat(json);
    } else {
      // we load the glyphs from JSON to avoid race conditions with asynchronous image loading
      this.canvas.loadFromJSON({ "objects": json.glyphs.reverse() }, function () {
        _this.canvas.renderAll();
        //render the canvas then load the tracks after all images have loaded to make sure things render nice
        _this.buildEntryTrackFromJson(json.entry, trackTypes.entryTrackType);
        _this.buildExitTrackFromJson(json.exit, trackTypes.exitTrackType);
        _this.buildAddedTracksFromJson(json.tracks);
        _this.canvas.forEachObject((object, index, array) => {
          if (object.idx)
            _this.canvas.moveTo(object, object.idx)
        })
        _this.addKmMarker(_this.markerAngle);
      }, function (o, object) {
            _this.loadGlyphFromJson(object);
      });
    }
  }

  loadOldTrackFormat(json) {
    console.log("old style");
    var numTracks = json.tracks.length;
    // build a propperly formatted json string to import
    var json = {
      "objects": [json.entry.point, json.entry.path, json.exit.path, json.exit.point].concat(json.tracks).concat(json.glyphs.reverse()),
    };
    var obs = [];
    this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function (o, object) {
      obs.push(object);
      if (object.type == "image") {
        //if the object is an image add it to the glyphs array
        _this.glyphs.push(object);
      }
    });
    var objects = { origin: obs[0], paths: [obs[1]] };
    this.entryTrack = new EntryTrack(null, null, objects);

    var objects = { end: obs[3], paths: [obs[2]] };
    this.exitTrack = new ExitTrack(null, null, null, objects);
    /*
      Aux tracks
    */
    // slice and dice obs
    if (numTracks > 0) {
      var tracks = obs.slice(4, 4 + numTracks);
      this.initTracks(tracks);
    }
  }

  buildEntryTrackFromJson(entry, entryTrackType) {
    var path = entry.path ?? entry.paths[0].path;
    this.entryTrack = new EntryTrack(entryTrackType, this.canvas, path);
  }

  buildExitTrackFromJson(exit, exitTrackType) {
    var path = exit.path ?? exit.paths[0].path;
    this.exitTrack = new ExitTrack(null, exitTrackType, this.canvas, path);
  }

  buildAddedTracksFromJson(tracks) {
    tracks.forEach(track => {
      var path = track.path ?? track.paths[0].path;
      var addedTrack = new AddedTrack(null, track.type, this.canvas, path, track.id ?? null);
      this.tracks.push(addedTrack);
    });
    this.canvas.renderAll();
  }

  beginEdit() {
    this.activeEditors.push(new EntryTrackEditor(this.canvas, this.entryTrack));
    this.activeEditors.push(new ExitTrackEditor(this.canvas, this.exitTrack));
    super.beginEdit();
  }

  removeActiveGlyph() {
    const activeObject = this.canvas.getActiveObject();
    var tracks = this.tracks;
    var glyphs = this.glyphs;
    if (activeObject && activeObject.id) {
      this.canvas.remove(activeObject);
      this.canvas.discardActiveObject();
      tracks.find((element, idx, arr) => {
        if (element.id == activeObject.id) {
          this.removeTrack(element)
        }
      });
      this.canvas.renderAll();
      this.glyphs = glyphs.filter(g => g.id !== activeObject.id);
      this.tracks = tracks.filter(g => g.id !== activeObject.id);
    }
  }

  sendBackwardActiveGlyph() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.id) {
      this.canvas.sendToBack(activeObject);
      this.canvas.forEachObject((object, index, array) => {
        object.idx = index;
      })
      this.canvas.renderAll();
    }
  }

  bringForwardActiveGlyph() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.id) {
      this.canvas.bringToFront(activeObject);
      this.canvas.forEachObject((object, index, array) => {
        object.idx = index;
      })
      this.canvas.renderAll();
    }
  }

  changeAddedTrackType(type) {
    this.addedTrackType = type
    if (this.selectedTrackId) {
      var track = this.tracks.find(({ id }) => id === this.selectedTrackId);
      this.finishEdit();
      track.changeType(type, this.canvas, false);
      track.type = type;
      this.canvas.renderAll();
      this.beginEdit()
    }
  }

  changeEntryTrackType(type) {
    this.finishEdit();
    this.entryTrack.changeType(type, this.canvas);
    this.beginEdit()
  }

  changeExitTrackType(type) {
    this.finishEdit();
    this.exitTrack.changeType(type, this.canvas);
    this.beginEdit()
  }

  changeExitAngle(angle, exitTrackType) {
    if (!this.exitTrackEdited && this.exitTrack) {
      this.exitTrack.changeAngle(angle, exitTrackType, this.canvas);
      if (this.activeEditors.length) {
        this.finishEdit();
        this.beginEdit();
      }
    }
  }

  finishEdit() {
    for (var i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
    }
    delete this.entryTrack.editor
    delete this.exitTrack.editor
    for (var i = 0; i < this.tracks.length; i++) {
      delete this.tracks[i].editor
    }
    this.activeEditors = [];
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.forEachObject(function (obj) {
      obj.selectable = false;
    });
    this.canvas.deactivateAllWithDispatch();
    this.selectedTrackId = null;
    this.canvas.deactivateAll().renderAll();
  }

  removeTrack(track) {
    if (track) {
      for (var i = 0; i < track.paths.length; i++) {
        this.canvas.remove(track.paths[i]);
      }
      for (var i = 0; i < this.activeEditors.length; i++) {
        if (this.activeEditors[i].track == track) {
          this.activeEditors[i].destroy();
        }
      }
    }
  }

  removeLastTrack() {
    this.removeTrack(this.tracks.pop());
  }

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize() {
    var json = {
      entry: {
        point: this.entryTrack.origin,
        paths: this.entryTrack.paths
      },
      exitTrackEdited: this.exitTrackEdited,
      exit: {
        point: this.exitTrack.end,
        paths: this.exitTrack.paths,
      },
      tracks: this.serializeTracks(),
      glyphs: this.serializeGlyphs(),
      markerAngle: this.markerAngle,
    };
    return json;
  }

  serializeTracks() {
    var tracksJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for (var track of this.tracks) {
      var json = { paths: track.paths, type: track.type, id: track.id };
      tracksJson.push(json);
    }
    return tracksJson;
  }

  addTrackHandles(options) {
    const target = options.target;
    if (target && target.id) {
      // var track = this.tracks.find(({ id }) => id === target.id);

      for (var i = 0; i < this.activeEditors.length; i++) {
        if (this.activeEditors[i] instanceof EntryTrackEditor || this.activeEditors[i] instanceof ExitTrackEditor)
          continue
        this.activeEditors[i].destroy();
        this.activeEditors.splice(i, 1);
      }

      for (var i = 0; i < this.tracks.length; i++) {
        delete this.tracks[i].editor
      }
      this.activeEditors.push(new AddedTrackEditor(this.canvas, this.tracks.find(({ id }) => id === target.id)));
    }
  }

  removeTrackHandles(options) {
    for (var i = 0; i < this.activeEditors.length; i++) {
      if (this.activeEditors[i] instanceof EntryTrackEditor || this.activeEditors[i] instanceof ExitTrackEditor)
        continue
      this.activeEditors[i].destroy();
      this.activeEditors.splice(i, 1);
    }

    for (var i = 0; i < this.tracks.length; i++) {
      delete this.tracks[i].editor
    }
  }

  addKmMarker(angle = 45) {
    const lineLength = 20;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    var line = new fabric.Line([0, 0, lineLength, 0], {  // We'll rotate it later
      stroke: 'black',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center'
    });
    var circle = new fabric.Circle({
      radius: 3,
      fill: 'black',
      originX: 'center',
      originY: 'center',
      left: lineLength,  // Positioned at the end of the line
      top: 0
    });
    var marker = new fabric.Group([line, circle], {
      left: centerX,
      top: centerY,
      originX: 'top',
      originY: 'center',
      angle: angle,  // Rotate the entire group 45 degrees
      selectable: false,   // Cannot be selected
      evented: false,      // Ignores mouse events (fully non-interactive)
      hoverCursor: 'default',
      id: "kmMarker"
    });

    // Add group to canvas
    this.canvas.add(marker);
  }

  rotateKmMarker() {
    var group = this.canvas.getObjects().find(obj => obj.id === 'kmMarker');
    if (group) {
      this.markerAngle += 90;
      if (this.markerAngle > 360) this.markerAngle -= 360;
      group.set('angle', this.markerAngle);
      this.canvas.renderAll();
    }
  }
}
