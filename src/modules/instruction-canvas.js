'use strict';
class InstructionCanvas {
    constructor(el) {
        this.canvas = new fabric.Canvas(el);
        this.canvas.selection = false;
        this.canvas.hoverCursor = 'pointer';
        this.canvas.preserveObjectStacking = true;

        this.setupEventListeners();

        this.glyphs = [];

    }

    clear() {
        this.canvas.clear();
    }

    setupEventListeners() {
        var _this = this;

        this.canvas.on('object:selected', (options) => {
            app.roadbook.canvasSelectedItemType(options.target?.type || null);
        });

        this.canvas.on('mouse:down', (options) => {
            if (options.target === undefined) {
                app.roadbook.canvasSelectedItemType(null);
            }
        });
        // Path
        this.canvas.on('path:created', function (options) {
            options.path.set({
                fill: options.path.canvas.freeDrawingBrush.fill,
                strokeLineJoin: 'round',
                strokeLineCap: 'round'
            });
            options.path.canvas.renderAll();

            options.path.id = 'draw_' + globalNode.randomUUID();
            _this.glyphs.push(options.path);
        });
    };

    // ====== Canvas items =======
    buildFromJson(json) {
        var _this = this;
        // we load the glyphs from JSON to avoid race conditions with asyncronus image loading
        this.canvas.loadFromJSON({ "objects": json.glyphs.reverse() }, function () {
            _this.canvas.renderAll();
        }, function (o, object) {
            _this.loadGlyphFromJson(object);
        });
    }

    loadGlyphFromJson(object) {
        var _this = this;

        object.selectable = false;
        if (!object.id)
            object.id = globalNode.randomUUID();

        // Handle CAP objects
        if (object.subType && object.subType == 'CAP') {
            var capText = object.getObjects().find(obj => obj.id === 'CAP');
            if (capText) {
                const instructions = app.roadbook.instructions();
                const lastInstruction = instructions[instructions.length - 1];
                lastInstruction.heading.subscribe(function (newValue) {
                    capText.setText(String(newValue));
                    _this.canvas.renderAll();
                });
            }
        }
        if (object.subType && (object.subType == 'CAP-A' || object.subType == 'CAP-C')) {
            var capText = object.getObjects().find(obj => obj.id === 'CAP-A' || obj.id === 'CAP-C');
            if (capText) {
                const instructions = app.roadbook.instructions();
                const lastInstruction = instructions[instructions.length - 1];
                lastInstruction.capAvg.subscribe(function (newValue) {
                    capText.setText(String(newValue));
                    _this.canvas.renderAll();
                });
            }
        }
        // Handle image object
        if (object.type == "image") {
            //if the object is an image add it to the glyphs array
            _this.glyphs.push(object);
            fabric.util.loadImage(object.src, function (img, isError) {
                if (isError || !img) {
                    console.warn(`Failed to load image: ${object.src}`);
                    // Fallback: Set a default image source
                    var remmapedSrc = _this.remapOldGlyphs(object.src);
                    if (remmapedSrc === false) {
                        remmapedSrc = './assets/svg/glyphs/missing-glyph.svg';
                    }
                    object.set({
                        originalWidth: object.width,
                        originalHeight: object.height,
                        originalScaleX: object.scaleX,
                        originalScaley: object.scaleY
                    });
                    object.setSrc(remmapedSrc, function () {
                        object.scaleToWidth(object.originalWidth * object.scaleX);
                        object.scaleToHeight(object.originalHeight * object.scaleY);
                        _this.canvas.renderAll();
                    }, { crossOrigin: 'anonymous' });
                }
            }, null, 'anonymous');
        } else {
            _this.glyphs.push(object);
        }
    }

    addGlyph(position, uri, vsize = 50, selectable = true) {
        this.finishRemove();
        var _this = this;
        var position = position;

        if (/\/CAP(-[AC])?\.svg$/.test(uri)) {
            fabric.loadSVGFromURL(uri, function (objects, options) {
                const capElement = fabric.util.groupSVGElements(objects, options);

                var capText = capElement.getObjects().find(obj => obj.id === 'CAP' || obj.id === 'CAP-A' || obj.id === 'CAP-C');
                capElement.subType = options.subType ?? capText?.id ?? null;
                if (capElement.subType) {
                    switch (capElement.subType) {
                        case 'CAP':
                            capText.setText(String(app.roadbook.currentlyEditingInstruction.heading()));
                            app.roadbook.currentlyEditingInstruction.heading.subscribe(function (newValue) {
                                capText.setText(String(newValue));
                                _this.canvas.renderAll();
                            });
                            break;
                        case 'CAP-A':
                        case 'CAP-C':
                            capText.setText(String(app.roadbook.currentlyEditingInstruction.capAvg()));
                            app.roadbook.currentlyEditingInstruction.capAvg.subscribe(function (newValue) {
                                capText.setText(String(newValue));
                                _this.canvas.renderAll();
                            });
                            break;
                        default:
                            break;
                    }
                }

                // capElement.scaleToWidth(60);
                capElement.top = position.top;
                capElement.left = position.left;
                capElement.id = globalNode.randomUUID();
                _this.glyphs.push(capElement);
                _this.canvas.add(capElement);
                _this.canvas.renderAll();
            });
            return;
        }

        var imgObj = new Image();
        imgObj.src = uri;
        imgObj.onload = function () {
            var image = new fabric.Image(imgObj);
            image.top = position.top;
            image.left = position.left;
            image.scaleToHeight(vsize);
            image.id = globalNode.randomUUID();
            image.selectable = selectable;
            const idx = _this.canvas.add(image);
            image.idx = idx._objects.length;
            _this.glyphs.push(image);
            if (app.roadbook && app.roadbook.currentlyEditingInstruction)
                app.roadbook.currentlyEditingInstruction.parseGlyphInfo(); // TODO: this must be handled by instruction
        }
    }

    remapOldGlyphs(oldPath) {
        // This function remaps old glyph paths to new ones in the roadbook instructions
        const glyphMappings = {
            "./assets/svg/glyphs/bridge.svg": "./assets/svg/glyphs/under-bridge.svg",
            "./assets/svg/glyphs/bad.svg": "./assets/svg/glyphs/abbr-MVS.svg",
            "./assets/svg/glyphs/finish-of-selective-section.svg": "./assets/svg/glyphs/abbr-ASS.svg",
            "./assets/svg/glyphs/start-of-selective-section.svg": "./assets/svg/glyphs/abbr-DSS.svg",
            "./assets/svg/glyphs/dune-L1.svg": "./assets/svg/glyphs/abbr-L1.svg",
            "./assets/svg/glyphs/dune-L2.svg": "./assets/svg/glyphs/abbr-L2.svg",
            "./assets/svg/glyphs/dune-L3.svg": "./assets/svg/glyphs/abbr-L3.svg",
            "./assets/svg/glyphs/abbr-dune.svg": "./assets/svg/glyphs/abbr-DN.svg",
            "./assets/svg/glyphs/always.svg": "./assets/svg/glyphs/abbr-TJS.svg",
            "./assets/svg/glyphs/collapsed.svg": "./assets/svg/glyphs/abbr-EFF.svg",
            "./assets/svg/glyphs/gravel.svg": "./assets/svg/glyphs/abbr-GV.svg",
            "./assets/svg/glyphs/imperative.svg": "./assets/svg/glyphs/abbr-IMP.svg",
            "./assets/svg/glyphs/main-track.svg": "./assets/svg/glyphs/abbr-PP.svg",
            "./assets/svg/glyphs/many.svg": "./assets/svg/glyphs/abbr-NBX.svg",
            "./assets/svg/glyphs/off-track.svg": "./assets/svg/glyphs/abbr-HP.svg",
            "./assets/svg/glyphs/parallel-tracks.svg": "./assets/svg/glyphs/abbr-.svg",
            "./assets/svg/glyphs/road.svg": "./assets/svg/glyphs/abbr-RO.svg",
            "./assets/svg/glyphs/rut.svg": "./assets/svg/glyphs/abbr-ORN.svg",
            "./assets/svg/glyphs/sand.svg": "./assets/svg/glyphs/abbr-SA.svg",
            "./assets/svg/glyphs/small-dune.svg": "./assets/svg/glyphs/abbr-DNT.svg",
            "./assets/svg/glyphs/stone.svg": "./assets/svg/glyphs/abbr-CX.svg",
            "./assets/svg/glyphs/vegetation.svg": "./assets/svg/glyphs/abbr-CX.svg",
            "./assets/svg/glyphs/track.svg": "./assets/svg/glyphs/abbr-P.svg",
        }
        return glyphMappings[oldPath] || false;
    }

    finishRemove() {
        // remove controls from glyphs and update the canvas' visual state
        this.canvas.deactivateAll().renderAll();
    }

    removeLastGlyph() {
        var glyph = this.glyphs.pop()
        this.canvas.remove(glyph);
    }

    removeActiveGlyph() {
        const activeObject = this.canvas.getActiveObject();
        var glyphs = this.glyphs;
        if (activeObject && activeObject.id) {
            this.canvas.remove(activeObject);
            this.canvas.discardActiveObject();
            this.canvas.renderAll();
            this.glyphs = glyphs.filter(g => g.id !== activeObject.id);
        }
    }

    beginEdit() {
        this.canvas.forEachObject(function (obj) {
            obj.selectable = true;
        });
    }

    finishEdit() {
        // remove controls from glyphs and update the canvas' visual state
        this.canvas.forEachObject(function (obj) {
            obj.selectable = false;
        });
        this.canvas.deactivateAll().renderAll();
    }

    // ====== Text handling =======
    addText(position, text, styles = { bold: false, italic: false, underline: false }) {
        this.finishRemove();
        var _this = this;
        var textObj = new fabric.TextElement(text);
        textObj.setPosition(position.top, position.left);
        if (styles.bold)
            textObj.setTextStyle('bold')
        if (styles.italic)
            textObj.setTextStyle('italic')
        if (styles.underline)
            textObj.setTextStyle('underline')
        textObj.id = globalNode.randomUUID();
        _this.glyphs.push(textObj);
        _this.canvas.add(textObj);
        _this.canvas.setActiveObject(textObj);
    }

    setTextStyle(style) {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.id && activeObject.type == 'TextElement') {
            activeObject.setTextStyle(style);
            this.canvas.renderAll();
        }
    }


    // ====== Serialization =======
    serialize() {
        var json = {
            glyphs: this.serializeGlyphs(),
        };
        return json;
    }

    serializeGlyphs() {
        var glyphsJson = [];
        // NOTE not sure, but again here the for loop doesn't error out like the for each
        for (var glyph of this.glyphs) {
            var json = glyph.toJSON()
            if (glyph.type == 'image') {
                // Do not store missing glyph image
                if (json.src.includes("missing-glyph")) {
                    json.src = glyph.src;
                    json.width = glyph.originalWidth;
                    json.height = glyph.originalHeight;
                    json.scaleX = glyph.originalScaleX;
                    json.scaleY = glyph.originalScaley;
                }
                json.src = this.truncateGlyphSource(json.src);
            }
            json.id = glyph.id;
            if (glyph.subType) {
                json.subType = glyph.subType;
            }
            json.idx = glyph.idx;
            glyphsJson.push(json);
        }
        return glyphsJson;
    }

    toPNG() {
        return this.canvas.toDataURL('image/png', 1);
    }

    toSVG() {
        return this.canvas.toSVG();
    }

    truncateGlyphSource(src) {
        var index = src.lastIndexOf("assets/svg/glyphs");
        return (index == -1 ? src.replace(app.settings.user_glyph_path, "{user_glyphs_path}") : "./" + src.slice(index));
    }
}