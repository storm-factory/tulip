var GlyphControls = Class({
  singleton: true,

  create: function(){
    this.fs = require('fs');
    this.getGylphNames();
  },

  getGylphNames(){
    return this.fs.readdir('assets/svg/details', function(err, files){
      console.log(files)
    });
  },
});
