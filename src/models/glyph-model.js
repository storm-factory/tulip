class GlyphModel {

  constructor(){
    this.fileTree = this.loadGlyphFiles();
    this.bindToKnockout();
  }

  populateKnockout(glyphs){
    this.routeDetails.descriptions(glyphs["route-details"].descriptions);
    this.routeDetails.conditions(glyphs["route-details"].conditions);
    this.routeDetails.actions(glyphs["route-details"].actions);
    this.trackDescriptions(glyphs["track-descriptions"]);
    this.terrainFeatures.manMade(glyphs["terrain-features"]["man-made"]);
    this.terrainFeatures.natural(glyphs["terrain-features"].natural);
    this.terrainFeatures.symbols(glyphs["terrain-features"].symbols);
    this.orga.notices(glyphs.orga.notices);
    this.orga.speedZones(glyphs.orga["speed-zones"]);
  }

  bindToKnockout(){
    this.routeDetails = {
      descriptions: ko.observableArray(),
      conditions: ko.observableArray(),
      actions: ko.observableArray()
    };
    this.trackDescriptions = ko.observableArray();
    this.terrainFeatures = {
      manMade: ko.observableArray(),
      natural: ko.observableArray(),
      symbols: ko.observableArray()
    };
    this.orga = {
      notices: ko.observableArray(),
      speedZones: ko.observableArray(),
    };
  }

  //model/module function
  findGlyphsByName(query){
    var results=[];
    $.each(this.fileList, function(i,file){
      if(file.name.indexOf(query) != -1){
        results.push({name: file.name.replace('.svg', ''), path: file.path})
      }
    });
    return results;
  }

  findBasePath(){
    var process = require('electron').remote.process;
    var fs = require('fs');
    try {
      //see if we can read the path to the packaged filesys
      var path = process.resourcesPath + '/app/assets/svg/glyphs/'
      this.fs.readdirSync(path)
      return path;
    } catch (e) {
      console.log("using unpackaged filesys");
      return './assets/glyphs'
    }
  }

  flattenGlyphFileTree(glyphs){
    var flatten = require('flat')
    var files = flatten(glyphs,{ maxDepth: 2 })
    this.fileList = Object.keys(files).map(function(key) { return files[key] }).reduce((a, b) => a.concat(b));
  }

  //model/module function
  loadGlyphFiles(){
    var glyphBasePath = this.findBasePath();
    return this.walkGlyphDirectory(glyphBasePath);
  }

  walkGlyphDirectory(glyphBasePath){
    var _this = this;
    var fs = require('fs');
    var walk = require('walk');
    var walker;
    var glyphs = {
        custom: [],
        orga: {notices: [], "speed-zones": []},
        "route-details": {actions: [], conditions: [], descriptions: []},
        "terrain-features": {"man-made": [], natural: [], symbols: []},
        "track-descriptions": []
    }
    walker = walk.walk(glyphBasePath);
    walker.on("file", function (root, fileStats, next) {
      fs.readFile(fileStats.name, function () {
        if(fileStats.name.endsWith('.svg')){
          var keys = root.split("glyphs")[1].replace('/','').split('/');
          if(keys.length > 1){
            glyphs[keys[0]][keys[1]].push({name: fileStats.name, path: require('path').join(root,fileStats.name)});
          } else {
            glyphs[keys[0]].push({name: fileStats.name, path: require('path').join(root,fileStats.name)});
          }
        }
        next();
      });
    });
    walker.on("end", function () {
      // _this.bindToKnockout(glyphs)
      _this.populateKnockout(glyphs)
      _this.flattenGlyphFileTree(glyphs)
    });
    return glyphs;
  }
}
