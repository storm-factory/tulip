/*
  Creates a note canvas object from either UI interaction or the loading of a saved file
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

class Note extends InstructionCanvas {

  constructor(el, json) {
    super(el);
    this.initNote(json);
  }

  /*
    Creates a note
  */
  initNote(json) {
    if (json !== undefined) {
      if (json.htmlText != '') {
        // Migrate old html format
        this.buildFromHtml(json.htmlText);
        this.finishEdit();
      } else {
        this.buildFromJson(json);
      }
    }
  }

  buildFromHtml(html) {
    html = html.replace('<br>', '\n');
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var body = doc.body;
    var nodes = body.childNodes;
    var images = doc.getElementsByTagName('img');
    var text = [];
    var top = 30;
    var left = 30;
    // Get images
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var position = { top: top, left: left };
      remappedSrc = this.remapOldGlyphs(img.src);
      if (remappedSrc !== false) {
        img.src = remappedSrc;
      }
      this.addGlyph(position, img.src);
      left += 60;
      if (left > 180) {
        left = 30;
        top += 60;
      }
    }
    // Get text nodes
    for (let node of nodes) {
      // Extract text and styles from the current node and its children
      const textWithStyles = this.extractTextWithStyles(node);

      // Process each extracted text with its styles
      for (let { text, styles } of textWithStyles) {
        const position = { top, left };
        // Pass text and styles to addText
        this.addText(position, text, styles);
        left += 60;
        if (left > 180) {
          left = 30;
          top += 60;
        }
      }
    }

  }

  extractTextWithStyles(node, styles = { italic: false, bold: false, underline: false }, result = []) {
    // If it's a text node with non-empty content
    if ((node.nodeType === Node.TEXT_NODE || node.nodeName === 'DIV') && node.textContent.trim() !== '') {
      result.push({
        text: node.textContent.trim(),
        styles: { ...styles } // Clone styles to avoid mutating
      });
    }
    // If it's an element node (<i>, <b>, <u>)
    else if (node.nodeType === Node.ELEMENT_NODE) {
      // Update styles based on the current node
      const newStyles = { ...styles };
      if (node.nodeName === 'I') newStyles.italic = true;
      if (node.nodeName === 'B') newStyles.bold = true;
      if (node.nodeName === 'U') newStyles.underline = true;

      // Recursively process child nodes
      for (let child of node.childNodes) {
        this.extractTextWithStyles(child, newStyles, result);
      }
    }
    return result;
  }

  appendGlyph(uri, vsize = 50, selectable = true) {
    const position = this.getNextEmptyPosition(vsize) || {left: 60, top: 60};
    this.addGlyph(position, uri, vsize, selectable);
  }

  getNextEmptyPosition(imageSize = 50) {
    const canvasWidth = 180;
    const canvasHeight = 180;
    const cols = Math.floor(canvasWidth / imageSize);
    const rows = Math.floor(canvasHeight / imageSize);
    // Calculate spacing
    const totalImageWidth = cols * imageSize;   // 150
    const totalImageHeight = rows * imageSize;  // 150
    const spacingX = (canvasWidth - totalImageWidth) / (cols + 1);   // 30/4 = 7.5
    const spacingY = (canvasHeight - totalImageHeight) / (rows + 1); // 30/4 = 7.5

    // Cell size including spacing
    const cellWidth = imageSize + spacingX;
    const cellHeight = imageSize + spacingY;

    // Create grid to track occupied spaces
    const grid = Array(rows).fill(null).map(() => Array(cols).fill(false));

    // Mark occupied positions
    this.canvas.getObjects('image').forEach(img => {
      // Find which cell this image belongs to
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellCenterX = spacingX + col * cellWidth + imageSize / 2;
          const cellCenterY = spacingY + row * cellHeight + imageSize / 2;

          // Check if image is close to this cell center (within imageSize/2)
          if (Math.abs(img.left - cellCenterX) < imageSize / 2 &&
            Math.abs(img.top - cellCenterY) < imageSize / 2) {
            grid[row][col] = true;
          }
        }
      }
    });

    // Find first empty position and return CENTER coordinates
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!grid[row][col]) {
          return {
            left: spacingX + col * cellWidth + imageSize / 2,
            top: spacingY + row * cellHeight + imageSize / 2
          };
        }
      }
    }

    return null; // No empty space
  }

  removeSpeedGlyph(end = false) {
    const pattern = end ? /\/assets\/svg\/glyphs\/speed-\d+-end\.svg/ : /\/assets\/svg\/glyphs\/speed-\d+\.svg/
    const objectsToRemove = this.canvas.getObjects().filter(obj => {
        const src = obj.getSrc ? obj.getSrc() : 
                    (obj._originalElement && obj._originalElement.src) || '';
        
        return pattern.test(src);
    });
    
    objectsToRemove.forEach(obj => this.canvas.remove(obj));
    
    this.canvas.renderAll();
    }
}
