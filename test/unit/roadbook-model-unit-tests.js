var test = require( 'tape' );
const fs = require( 'fs' );

var model = require('../../src/models/roadbook-model.js').roadbookModel;


test( 'Can add an instruction to the roadbook', function( assert ) {
  global.globalNode = Object();
  globalNode.fs = fs;
  var roadbookModel = new model();
  var instructionData = {"lat":37.28077782611077,"long":-107.88813478471678,"routePointIndex":0,"kmFromStart":0,"kmFromPrev":0,"heading":0,"relativeAngle":0};
  /*
    Mock stuff
  */
  roadbookModel.editingInstruction = true;
  roadbookModel.instructions = ["one", "two", "three", "four" ];
  roadbookModel.reindexed = false;
  roadbookModel.controller = {saveButtonHighlighted: false, highlightSaveButton: function(){this.saveButtonHighlighted = true}};
  roadbookModel.finishInstructionEdit = function(){roadbookModel.editingInstruction = false};
  roadbookModel.determineInstructionInsertionIndex = function(kmFromStart) { return (kmFromStart == instructionData.kmFromStart) ? 2 : 1};
  roadbookModel.determineInstructionTrackTypes = function(index, data){
                                                                        if(index == 2){
                                                                          data.entryTrackType = 'track';
                                                                          data.exitTrackType = 'road';
                                                                        }
                                                                      };
  roadbookModel.instantiateInstruction = function(data){ return data}
  roadbookModel.reindexInstructions = function(){roadbookModel.reindexed = true;}
  /*
    run our test
  */
  roadbookModel.addInstruction(instructionData)

  assert.ok(!roadbookModel.editingInstruction, "It turns off edit mode if it's on");
  assert.ok(roadbookModel.controller.saveButtonHighlighted, "It tells the controller to update UI state.");
  assert.deepEqual(roadbookModel.instructions[2], { lat: 37.28077782611077,long: -107.88813478471678,routePointIndex: 0,kmFromStart: 0,kmFromPrev: 0,heading: 0,relativeAngle: 0,entryTrackType: 'track',exitTrackType: 'road' }, "It adds the instruction at the correct index with the correct track types" )

  assert.end();
} );
