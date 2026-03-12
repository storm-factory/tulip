// Phase 6: Converted to vanilla JavaScript
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

document.addEventListener('DOMContentLoaded', function(){
    loadGlyphTable();

	var arg;
	ipc = require('electron').ipcRenderer;
	ipc.on('print-data', function(event, arg){
		filePath = arg;
    });
	ipc.send('print-launched', true);

	window.addEventListener('scroll', function() {
		var mainNav = document.querySelector(".main-nav");
		if(mainNav){
			if(window.scrollY > 0){
				mainNav.classList.add("main-nav-scrolled");
			} else {
				mainNav.classList.remove("main-nav-scrolled");
			}
		}
	});

	var buttons = document.querySelectorAll('.button');
	buttons.forEach(function(button){
		button.addEventListener('click', function(){
			requestPdfPrint();
		});
	});
});

function loadGlyphTable() {
	// Phase 6: Load HTML content using fetch instead of jQuery .load()
	fetch("index.html")
		.then(response => response.text())
		.then(responseTxt => {
			// Create a temporary container to parse the HTML
			var tempDiv = document.createElement('div');
			tempDiv.innerHTML = responseTxt;

			// Find the #glyphs section
			var glyphsContent = tempDiv.querySelector('#glyphs');
			if(!glyphsContent) {
				alert("Error: Could not load glyphs from index.html");
				return;
			}

			// Put it in storage
			var storage = document.querySelector("#storage");
			if(storage){
				storage.innerHTML = glyphsContent.outerHTML;
			}

			// Now process the glyphs
			var aGlyphs = storage ? storage.querySelectorAll("li") : [];
			var j=-1;
			var newrow = "";
			for(var i = 0; i < aGlyphs.length; i++){
				var aGlyph = aGlyphs[i];
				var glyphLinks = aGlyph.querySelectorAll("a.th");

				if(glyphLinks.length > 0){
					var glyphImg = glyphLinks[0].innerHTML;
					glyphImg = glyphImg.slice(0,-1) + ' height="' + glyphHeight + '">';

					var glyphParagraphs = aGlyph.querySelectorAll("p");
					var glyphTxt = glyphParagraphs.length > 0 ? glyphParagraphs[0].textContent : '';

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

							// Insert before #lexiconLoading
							var lexiconLoading = document.querySelector("#lexiconLoading");
							if(lexiconLoading){
								var tempContainer = document.createElement('div');
								tempContainer.innerHTML = newrow;
								while(tempContainer.firstChild){
									lexiconLoading.parentNode.insertBefore(tempContainer.firstChild, lexiconLoading);
								}
							}
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

				// Insert before #lexiconLoading
				var lexiconLoading = document.querySelector("#lexiconLoading");
				if(lexiconLoading){
					var tempContainer = document.createElement('div');
					tempContainer.innerHTML = newrow;
					while(tempContainer.firstChild){
						lexiconLoading.parentNode.insertBefore(tempContainer.firstChild, lexiconLoading);
					}
				}
			}

			// Remove loading indicator
			var lexiconLoading = document.querySelector("#lexiconLoading");
			if(lexiconLoading) lexiconLoading.remove();
		})
		.catch(error => {
			alert("Error loading glyphs: " + error);
		});
}

function requestPdfPrint(){
    var nav = document.querySelector('nav');
    if(nav) nav.style.display = 'none';

	var data = {'filepath': filePath, 'opts': {'pageSize': 'Letter', 'pageSizeName': 'Letter', 'marginsType' : '1'}};
    ipc.send('print-lexicon-pdf', data);
}
