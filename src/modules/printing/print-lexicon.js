function glyphRules(name) {
	if(name == '') return false;
	if(name == 'cliff') return true;
	if(name.includes('cliff')) return false;
	if(name == '25kph') return true;
	if(name.slice(-3) == 'kph') return false;
	return true;	
}

const tablewidth = 4;
const glyphHeight = 40;
const pageLength = 18;
var ipc;
var filePath;

$(document).ready(function(){
    loadGlyphTable();

	var arg;
	ipc = require('electron').ipcRenderer;
	ipc.on('print-data', function(event, arg){
		filePath = arg;
    });
	ipc.send('print-launched', true);

	$(window).scroll(function() {
		if( $(this).scrollTop() > 0 ) {
			$(".main-nav").addClass("main-nav-scrolled");
		} else {
			$(".main-nav").removeClass("main-nav-scrolled");
		}
	});
	$('.button').click(function(){
		requestPdfPrint();
	});
});

function loadGlyphTable() {
	$("#storage").load("index.html #glyphs",function(responseTxt,statusTxt,xhr){
		if(statusTxt == "success") 
			
			var aGlyphs = $("#storage").find("li");
			var j=-1;
			var newrow = "";
			for(var i = 0; i < aGlyphs.size();i++){
				var aGlyph = aGlyphs.eq(i);
				if($(aGlyph).children("a.th").size() > 0){
					var glyphImg = $(aGlyph).find("a.th").html();
					glyphImg = glyphImg.slice(0,-1) + ' height="' + glyphHeight + '">';
					
					var glyphTxt = $(aGlyph).children("p").text();
					
					if(glyphRules(glyphTxt)){
						j++;
						if((j/tablewidth % pageLength ==0)){
							newrow = "<h3>Tulip Lexicon</h3>";
							newrow += "<div class='firstrow'>";
						} else if( j%tablewidth == 0 ) {
							if( j > 0 && (j/tablewidth % pageLength == pageLength-1)){
								newrow = "<div class='break otherrow'>";
							} else {
								newrow = "<div class='otherrow'>";
							}
						}
						if(glyphTxt == '') glyphTxt = '<p></p>'
						newrow += "<div class='glyphcolumn'>"
							+ glyphImg + "</div><div class='desccolumn'>" + glyphTxt + "</div>";
						if( j%tablewidth == tablewidth-1 ) {
							newrow += "</div>";
							$(newrow).insertBefore("#lexiconLoading");
							newrow="";
						}
					}
				}				
			}
			if( newrow != "" ){
				while(j%tablewidth != tablewidth-1){
					newrow += "<div class='glyphcolumn'><p></p></div>"
						+ "<div class='desccolumn'><p></p></div>"
					j++;
				}
				newrow += "</div>";
				$(newrow).insertBefore("#lexiconLoading"); 
			}
			$("#lexiconLoading").remove();
			
		if(statusTxt == "error")
			alert("Error: " + xhr.status + ": " + xhr.statusText);
	});
	
}

function requestPdfPrint(){
    $('nav').hide();
	var data = {'filepath': filePath, 
			'opts': {
				'pageSize': 'Letter',
				'pageSizeName': 'Letter',
				'marginsType' : 1}};
    ipc.send('print-lexicon-pdf', data);
}
