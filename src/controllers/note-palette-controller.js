class NotePaletteController extends BasePaletteController{
  constructor(roadbook,glyphManager){
    super();
    this.bindToNoteSelection();
    this.bindToNotificationUI(roadbook,glyphManager);
  }

  addGlyphToNote(element){
    var src = $(element).attr('src');
    app.roadbook.appendGlyphToNoteTextEditor($('<img>').attr('src', src).addClass('normal'));
  }

  /*
    Here we check the note section for WPM glyphs, !!! glyphs, and eventually speed zone glyphs
    so that we can capture data for rally blitz or rally comp exports
  */
  checkForNotification(){
    if(app.roadbook.currentlyEditingInstruction){
      // reduce DOM image objects in the text editor to a collection of glyph names
      var glyphs = $('#note-editor').find("img").toArray().map(function(g){return $(g).attr('src').match(/\/([a-z0-9,-]*)\./)[1]})
      app.roadbook.currentlyEditingInstruction.manageNotifications(glyphs);
    }
  }

  bindToNoteSelection(){
    var _this = this;
    $('#note-selection-size-range').change(function(e){
      document.execCommand('fontSize',null,$(this).val());
      var sizes = {3: 'small', 4: 'normal', 5: 'large', 6: 'huge'}
      var size = sizes[$(this).val()];
      _this.resizeSelection(size);
    });

    $('#note-selection-bold').click(function(){
      document.execCommand('bold',null,false);
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-italic').click(function(){
      document.execCommand('italic',null,false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-underline').click(function(){
      document.execCommand('underline',null,false)
      $(this).toggleClass('active');
      $(this).blur();
    })
  }

  bindToNotificationUI(roadbook){
    var _this = this;
    $('#show-notification-options').click(function(){
      var notification = roadbook.currentlyEditingInstruction.notification;
      $('#notification-bubble').val(notification.bubble);
      $('#notification-modifier').val(notification.modifier);
      $('#notification-modifier').attr('min', notification.modMin);
      $('#notification-modifier').attr('max', notification.modMax);
      $('#notification-modifier').attr('step', notification.modStep);
    });
    //TODO decouple this
    $('#notification-bubble, #notification-modifier').bind('keyup input',function(){
      var notification = roadbook.currentlyEditingInstruction.notification;
      notification.bubble = $('#notification-bubble').val();
      notification.modifier = $('#notification-modifier').val();
      _this.checkForNotification(); //TODO This needs refactored (mehbe as callback)
    });
  }

  bindToGlyphModal(){
    // TODO move to note palette
    $('#add-glyph-to-note').click(function(e){
      e.preventDefault();
      _this.bindToGlyphModalImages(roadbook,_this.addGlyphToTulip);
      $('#glyphs').foundation('reveal', 'open');
      setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    });
  }

  updateNotificationControls(notification){
    $('#notification-bubble').val(notification.bubble);
    $('#notification-modifier').val(notification.modifier);
    $('#notification-modifier').attr('min', notification.modMin);
    $('#notification-modifier').attr('max', notification.modMax);
    $('#notification-modifier').attr('step', notification.modStep);
  }

  resizeSelection(size){
    var sel = window.getSelection();
    var images = $('#note-editor img')
    for(var i=0;i<images.length;i++){
      if(sel.containsNode(images[i])){
        $(images[i]).removeClass();
        $(images[i]).addClass(size);
      }
    }
  }

}
