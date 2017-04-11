'use strict';
// TODO refactor this to use MVC pattern and act as a model for the roadbook all UI interaction should be moved to an application controller, also change to ES6 syntax
class RoadbookController{
  constructor(model){
    this.model = model
    this.bindToWaypointDescriptionInput();
    this.bindToNameDescEditButtons();
    this.bindToPaletteControls();
    this.bindToTrackGrid();
    this.bindToEntryTrackSelector();
    this.bindToExitTrackSelector();
    this.bindToAddedTrackSelector();
  }

  /*
    initialize rich text editor for the roadbook description
  */
  bindToWaypointDescriptionInput(){
    var _this = this;
    this.descriptionTextEditor = new Quill('#description-editor');
    this.descriptionTextEditor.addModule('toolbar', {
      container: '#description-toolbar'     // Selector for toolbar container
    });
    this.descriptionTextEditor.on('text-change', function(delta, source) {
      var newValue = _this.descriptionTextEditor.getHTML()
      _this.model.desc(newValue);
    });
  }

  bindToNameDescEditButtons(){
    var _this = this;
    $('#roadbook-desc, #roadbook-name').find('a.show-editor').click(function(){
      $(this).hide();
      $(this).siblings('.hide-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideDown('fast');
      if($(this).hasClass('rb-name')){
        $(this).parent('div').find(':input').focus();
      }
      if($(this).hasClass('rb-desc')){
        $('#roadbook-desc p').slideUp('fast');
        _this.descriptionTextEditor.focus();
      }
      $('#save-roadbook').removeClass('secondary');
      // TODO should we track this here?
      _this.model.editingNameDesc = true;
    });

    $('#roadbook-desc, #roadbook-name').find('a.hide-editor').click(function(){
      $(this).hide();
      $(this).siblings('.show-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideUp('fast');
      if($(this).hasClass('rb-desc')){
        $('#roadbook-desc p').slideDown('fast');
      }
    });
  }

  bindToPaletteControls(){
    var _this = this;
    $('#hide-palette').click(function(){
      _this.model.finishWaypointEdit();
    });

    $('#toggle-heading').change(function(){
      $('#note-editor-container').toggleClass('hideCap',!_this.model.waypointShowHeading())
      _this.model.currentlyEditingWaypoint.showHeading(_this.model.waypointShowHeading());
    });
  }

  bindToTrackGrid(){
    var _this = this;
    $('.track-grid').click(function(e){
      if($(this).hasClass('undo')){
        if(e.shiftKey){
          _this.model.currentlyEditingWaypoint.tulip.beginRemoveTrack();
        }else{
          _this.model.currentlyEditingWaypoint.tulip.removeLastTrack();
        }
        return
      }
      var angle = $(this).data('angle');
      _this.model.currentlyEditingWaypoint.tulip.addTrack(angle);
    });
  }

  bindToEntryTrackSelector(){
    var _this = this;
    $('.entry-track-selector').click(function(e) {
      e.preventDefault();
      if('off-piste-entry' == $(this).attr('id')){
        _this.model.changeEditingWaypointEntry('offPiste')
      }else if('track-entry' == $(this).attr('id')){
        _this.model.changeEditingWaypointEntry('track')
      }else if('road-entry' == $(this).attr('id')){
        _this.model.changeEditingWaypointEntry('road')
      }else if('main-road-entry' == $(this).attr('id')){
        _this.model.changeEditingWaypointEntry('mainRoad')
      }else if('dcw-entry' == $(this).attr('id')){
        _this.model.changeEditingWaypointEntry('dcw')
      }
    });
  }

  bindToExitTrackSelector(){
    var _this = this;
    $('.exit-track-selector').click(function(e) {
      e.preventDefault();
      if('off-piste-exit' == $(this).attr('id')){
        _this.model.changeEditingWaypointExit('offPiste')
      }else if('track-exit' == $(this).attr('id')){
        _this.model.changeEditingWaypointExit('track')
      }else if('road-exit' == $(this).attr('id')){
        _this.model.changeEditingWaypointExit('road')
      }else if('main-road-exit' == $(this).attr('id')){
        _this.model.changeEditingWaypointExit('mainRoad')
      }else if('dcw-exit' == $(this).attr('id')){
        _this.model.changeEditingWaypointExit('dcw')
      }
    });
  }

  bindToAddedTrackSelector(){
    var _this = this;
    $('.added-track-selector').click(function(e) {
      e.preventDefault();
      if('off-piste-added' == $(this).attr('id')){
        _this.model.changeEditingWaypointAdded('offPiste')
      }else if('track-added' == $(this).attr('id')){
        _this.model.changeEditingWaypointAdded('track')
      }else if('road-added' == $(this).attr('id')){
        _this.model.changeEditingWaypointAdded('road')
      }else if('main-road-added' == $(this).attr('id')){
        _this.model.changeEditingWaypointAdded('mainRoad')
      }else if('dcw-added' == $(this).attr('id')){
        _this.model.changeEditingWaypointAdded('dcw')
      }

      $('.added-track-selector').removeClass('active');
      $(this).addClass('active');
    });
  }
}
