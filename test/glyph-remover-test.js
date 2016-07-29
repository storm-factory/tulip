
QUnit.module( "GlyphRemover", {
  before: function() {
    this.tulip = new Tulip($('canvas')[0], 45, {entryTrackType: 'track', exitTrackType: 'track'}, null);
  },
  beforeEach: function(assert) {
    // HACK we have to pause test execution, create the fabric image which is async, then create the glyph removers in it's load callback and resume execution
    // there is probably a cleaner and more clever way to do this
    var done = assert.async();
    var _this = this;
    var position = {top:25, left:25};
    var imgObj = new Image();
    imgObj.src = '../assets/svg/glyphs/always.svg';
    imgObj.onload = function () {
      var image = new fabric.Image(imgObj);
      image.top = position.top;
      image.left = position.left;
      image.scaleToWidth(75);
      _this.tulip.glyphs.push(image);
      _this.glyphRemover = new GlyphRemover(_this.tulip,_this.tulip.glyphs[0], 0);
      done();
    }
  },
  afterEach:  function(){
    this.glyphRemover = null;
    this.tulip.glyphs = [];
  },
  after:  function(){
    this.tulip = null;
  }
});
QUnit.test("Describe Create", function( assert ) {
  assert.ok(this.glyphRemover.glyph == this.tulip.glyphs[this.glyphRemover.glyphIndex] && this.glyphRemover.tulip.canvas ==  this.tulip.canvas && this.glyphRemover.tulip == this.tulip, "It can be created for a tulips glyph and index");
});

QUnit.test("Describe Make Remove Handle", function( assert ){
  var handle = new fabric.Text('\u00D7', {
                                          fontSize: 30,
                                          left: this.glyphRemover.glyph.getLeft(),
                                          top: this.glyphRemover.glyph.getTop(),
                                          fontFamily: 'Helvetica',
                                          fontWeight: 'bold',
                                          fill: '#ff4200',
                                          hasControls: false,
                                          lockMovementX: true,
                                          lockMovementY: true,
                                          hasBorders: false,
                                          selectable:false,
                                        });
  assert.equal($(this.glyphRemover.glyph.toSVG()).attr('d'),$(handle.toSVG()).attr('d'), "It makes a red X in the middle of the glyph" )
});

QUnit.test("Describe Remove From Canvas", function( assert ) {
  var len = this.tulip.glyphs.length;
  this.glyphRemover.removeFromTulip();
  assert.ok((len - 1) == this.tulip.glyphs.length, "It removes the glyph from the tulip")
});
