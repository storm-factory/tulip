// TODO This is a controller from the waypoint palette view to the roadbook model's currentlyEditingInstruction
class NoteControls {
  constructor() {
    var _this = this;

    $('#note-selection-bold').on('click', function () {
      document.execCommand('bold', null, false);
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-italic').on('click', function () {
      document.execCommand('italic', null, false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-underline').on('click', function () {
      document.execCommand('underline', null, false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    //TODO decouple this
    $('#notification-open-radius, #notification-validation-radius').on('keyup input', function () {
      var notification = app.roadbook.currentlyEditingInstruction.notification;
      notification.openRadius = parseInt($('#notification-open-radius').val());
      notification.validationRadius = parseInt($('#notification-validation-radius').val());
      if (notification.validationRadius > notification.openRadius) {
        notification.openRadius = notification.validationRadius;
        $('#notification-open-radius').val(notification.openRadius);
      }
      $('#notification-open-radius').attr('min', notification.validationRadius);
      notification.time = $('#notification-time').val();
      app.roadbook.currentlyEditingInstruction.updateWaypointBubble();
      app.roadbook.currentlyEditingInstruction.parseGlyphInfo(); // TODO: this must be handled by instruction
    });

  }

  updateNotificationControls(notification) {
    $('#notification-open-radius').val(notification.openRadius);
    $('#notification-validation-radius').val(notification.validationRadius);
    $('#notification-time').val(notification.time);
    $('#notification-validation-radius').attr('min', Notification.getUiElements(notification.type).modMin);
    $('#notification-validation-radius').attr('max', Notification.getUiElements(notification.type).modMax);
    $('#notification-validation-radius').attr('step', Notification.getUiElements(notification.type).modStep);
    if (notification.openRadius) {
      $('#notification-open-radius-wrapper').removeClass('waypoint-parameter-none')
    } else {
      $('#notification-open-radius-wrapper').addClass('waypoint-parameter-none')
    }
    if (notification.time) {
      $('#notification-time-wrapper').removeClass('waypoint-parameter-none')
    } else {
      $('#notification-time-wrapper').addClass('waypoint-parameter-none')
    }
  }

}
