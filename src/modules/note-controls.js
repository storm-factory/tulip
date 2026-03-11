// TODO This is a controller from the waypoint palette view to the roadbook model's currentlyEditingWaypoint
// Phase 6: Converted to vanilla JavaScript
class NoteControls {
  constructor() {
    var _this = this;

    var noteEditor = document.querySelector('#note-editor');
    if(noteEditor){
      noteEditor.addEventListener('input', function() {
        _this.checkForNotification();
      });
    }

    var sizeRange = document.querySelector('#note-selection-size-range');
    if(sizeRange){
      sizeRange.addEventListener('change', function(e){
        document.execCommand('fontSize', null, this.value);
        var sizes = {3: 'small', 4: 'normal', 5: 'large', 6: 'huge'};
        var size = sizes[this.value];
        _this.resizeSelection(size);
      });
    }

    var boldBtn = document.querySelector('#note-selection-bold');
    if(boldBtn){
      boldBtn.addEventListener('click', function(){
        document.execCommand('bold', null, false);
        this.classList.toggle('active');
        this.blur();
      });
    }

    var italicBtn = document.querySelector('#note-selection-italic');
    if(italicBtn){
      italicBtn.addEventListener('click', function(){
        document.execCommand('italic', null, false);
        this.classList.toggle('active');
        this.blur();
      });
    }

    var underlineBtn = document.querySelector('#note-selection-underline');
    if(underlineBtn){
      underlineBtn.addEventListener('click', function(){
        document.execCommand('underline', null, false);
        this.classList.toggle('active');
        this.blur();
      });
    }

    var showNotificationOptions = document.querySelector('#show-notification-options');
    if(showNotificationOptions){
      showNotificationOptions.addEventListener('click', function(){
        var notification = app.roadbook.currentlyEditingWaypoint.notification;
        var notificationBubble = document.querySelector('#notification-bubble');
        var notificationModifier = document.querySelector('#notification-modifier');

        if(notificationBubble) notificationBubble.value = notification.bubble;
        if(notificationModifier){
          notificationModifier.value = notification.modifier;
          notificationModifier.setAttribute('min', notification.modMin);
          notificationModifier.setAttribute('max', notification.modMax);
          notificationModifier.setAttribute('step', notification.modStep);
        }
      });
    }

    var notificationBubble = document.querySelector('#notification-bubble');
    var notificationModifier = document.querySelector('#notification-modifier');

    var changeHandler = function(){
      var notification = app.roadbook.currentlyEditingWaypoint.notification;
      var bubbleEl = document.querySelector('#notification-bubble');
      var modifierEl = document.querySelector('#notification-modifier');

      if(bubbleEl) notification.bubble = bubbleEl.value;
      if(modifierEl) notification.modifier = modifierEl.value;
      _this.checkForNotification(); //TODO This needs refactored
    };

    if(notificationBubble) notificationBubble.addEventListener('change', changeHandler);
    if(notificationModifier) notificationModifier.addEventListener('change', changeHandler);
  }

  updateNotificationControls(notification){
    var notificationBubble = document.querySelector('#notification-bubble');
    var notificationModifier = document.querySelector('#notification-modifier');

    if(notificationBubble) notificationBubble.value = notification.bubble;
    if(notificationModifier){
      notificationModifier.value = notification.modifier;
      notificationModifier.setAttribute('min', notification.modMin);
      notificationModifier.setAttribute('max', notification.modMax);
      notificationModifier.setAttribute('step', notification.modStep);
    }
  }

  resizeSelection(size){
    var sel = window.getSelection();
    var noteEditor = document.querySelector('#note-editor');
    if(!noteEditor) return;

    var images = noteEditor.querySelectorAll('img');
    for(var i = 0; i < images.length; i++){
      if(sel.containsNode(images[i])){
        images[i].className = ''; // Clear all classes
        images[i].classList.add(size);
      }
    }
  }

  /*
    Here we check the note section for WPM glyphs, !!! glyphs, and eventually speed zone glyphs
    so that we can capture data for rally blitz or rally comp exports
  */
  checkForNotification(){
    if(app.roadbook.currentlyEditingWaypoint){
      var noteEditor = document.querySelector('#note-editor');
      if(!noteEditor) return;

      // reduce DOM image objects in the text editor to a collection of glyph names
      var images = noteEditor.querySelectorAll('img');
      var glyphs = Array.from(images).map(function(g){
        var src = g.getAttribute('src');
        var match = src ? src.match(/\/([a-z0-9,-]*)\./): null;
        return match ? match[1] : null;
      }).filter(function(g){ return g !== null; });

      app.roadbook.currentlyEditingWaypoint.manageNotifications(glyphs);
    }
  }
}
