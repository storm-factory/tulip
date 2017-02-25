class NoteControls {
  constructor() {
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
