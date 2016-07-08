var GlyphControls = Class({
  singleton: true,

  create: function(){
    this.fs = require('fs');
    this.files = [];
    this.getGylphNames();
  },

  getGylphNames(){
    var dirs = ['details', 'features', 'orga', 'tracks'];
    var _this = this;
    $.each(dirs, function(i,v){
      _this.files = _this.files.concat(_this.fs.readdirSync('assets/svg/' + v));
    });
  },

  processFiles: function(){

  },

});
