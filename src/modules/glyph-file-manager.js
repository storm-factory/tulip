class GlyphFileManager {

  constructor(){
    this.files = this.loadGlyphFiles();
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

  //model/module function
  loadGlyphFiles(){
    var files;
    var fs = require('fs');
    var process = require('electron').remote.process;
    try {
      var path = process.resourcesPath + '/app/assets/svg/glyphs/';
      console.log(path);
      files = fs.readdirSync(path);
    } catch (e) {
      console.log("using unpackaged filesys");
      files = fs.readdirSync('./assets/svg/glyphs');
    }
    return files.filter(function(val){ return val.endsWith('.svg')});
  }
}
