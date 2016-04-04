/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
*/

var Note = Class({

  create: function(el, json){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    console.log(this)
  },

  /*
    Build the Canvas object from a json string
  */
  loadFromJson: function(json){
    return "todo: load"
  },

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize: function(){
    return "todo: serialize"
  },

});
