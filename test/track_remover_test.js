QUnit.module( "TrackRemover", {
  before: function() {
    this.tulip = new Tulip($('canvas')[0], 45, {entryTrackType: 'track', exitTrackType: 'track'}, null);
  },
  beforeEach: function() {
    this.tulip.addTrack(45);
    this.tulip.addTrack(90);
    this.tulip.addTrack(135);
    this.trackRemover = new TrackRemover(this.tulip,this.tulip.tracks[1], 1);
  },
  afterEach:  function(){
    this.trackRemover = null;
    this.tulip.tracks = [];
  },
  after:  function(){
    this.tulip = null;
  }
});
QUnit.test("Describe Create", function( assert ) {
  assert.ok(this.trackRemover.track == this.tulip.tracks[this.trackRemover.trackIndex] && this.trackRemover.tulip.canvas ==  this.tulip.canvas && this.trackRemover.tulip == this.tulip, "It can be created for a tulips track and index")
});

QUnit.test("Describe Make Remove Handle", function( assert ){
  var handle = new fabric.Text('\u00D7', {
                                          fontSize: 30,
                                          left: this.trackRemover.track.path[3][5],
                                          top: this.trackRemover.track.path[3][6],
                                          fontFamily: 'Helvetica',
                                          fontWeight: 'bold',
                                          fill: '#ff4200',
                                          hasControls: false,
                                          lockMovementX: true,
                                          lockMovementY: true,
                                          hasBorders: false,
                                          selectable:false,
                                        });
  assert.equal($(this.trackRemover.removeHandle.toSVG()).attr('d'),$(handle.toSVG()).attr('d'), "It makes a red X at the end of the track" )
});

QUnit.test("Describe Remove From Canvas", function( assert ) {
  var len = this.tulip.tracks.length;
  this.trackRemover.removeFromTulip();
  assert.ok((len - 1) == this.tulip.tracks.length, "It removes the track from the tulip")
});
