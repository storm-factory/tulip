class GlyphFileManager {

  constructor(){
    this.files = this.loadGlyphFiles();
    console.log(this.files);
  }

  //model/module function
  findGlyphsByName(query){
    var results=[];
    $.each(this.files, function(i,file){
      if(file.indexOf(query) != -1){
        results.push({name: file.replace('.svg', ''), path: 'assets/svg/glyphs/'+file})
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
      // return './assets/svg/glyphs';
      return './assets/glyphs'
    }
  }

  //model/module function
  loadGlyphFiles(){
    var glyphBasePath = this.findBasePath();
    return this.walkGlyphDirectory(glyphBasePath);
  }

  walkGlyphDirectory(glyphBasePath){
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
    return glyphs;
  }
}
