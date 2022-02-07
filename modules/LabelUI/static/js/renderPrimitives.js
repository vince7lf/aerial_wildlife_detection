function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    /**
     * Draws a rounded rectangle using the current state of the canvas.
     * If you omit the last three params, it will draw a rectangle
     * outline with a 5 pixel border radius
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate
     * @param {Number} width The width of the rectangle
     * @param {Number} height The height of the rectangle
     * @param {Number} [radius = 5] The corner radius; It can also be an object
     *                 to specify different radii for corners
     * @param {Number} [radius.tl = 0] Top left
     * @param {Number} [radius.tr = 0] Top right
     * @param {Number} [radius.br = 0] Bottom right
     * @param {Number} [radius.bl = 0] Bottom left
     * @param {Boolean} [fill = false] Whether to fill the rectangle.
     * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
     *
     * source: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
     */
    if (typeof (stroke) == 'undefined') {
        stroke = true;
    }
    if (typeof (radius) === 'undefined') {
        radius = 5;
    }
    if (typeof (radius) === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }

}


class AbstractRenderElement {

    constructor(id, style, zIndex, disableInteractions) {
        this.id = id;
        this.style = style;
        if (this.style === null || this.style === undefined) {
            this.style = {};
        }
        this.zIndex = (zIndex == null ? 0 : zIndex);
        this.disableInteractions = disableInteractions;
        this.isActive = false;
        this.changed = false;   // will be set to true if user modifies the initial geometry
        this.lastUpdated = new Date();  // timestamp of last update
        this.isValid = true;    // set to false by instances that are missing required properties (e.g. coordinates)
        this.unsure = false;
        this.visible = true;
    }

    getProperty(propertyName) {
        if (this.hasOwnProperty(propertyName)) {
            return this[propertyName];
        } else if (this.style.hasOwnProperty(propertyName)) {
            return this.style[propertyName];
        }
        return null;
    }

    setProperty(propertyName, value) {

        // handle style properties separately
        if (this.style.hasOwnProperty(propertyName)) {
            this.style[propertyName] = value;
        }
        this[propertyName] = value;

        // set to user-modified
        if (!['id', 'isActive', 'visible', 'zIndex'].includes(propertyName)) {
            this.changed = true;
            this.lastUpdated = new Date();
        }
    }

    getGeometry() {
        return {
            'unsure': this.unsure
        };
    }

    getLastUpdated() {
        return this.lastUpdated;
    }

    setActive(active, viewport) {
        this.isActive = active;
    }

    zIndex() {
        return this.zIndex;
    }

    setVisible(visible) {
        this.visible = visible;
    }

    render(ctx, scaleFun) {
        if (!this.visible) return;
    }
}


class ElementGroup extends AbstractRenderElement {

    constructor(id, elements, zIndex, disableInteractions) {
        super(id, null, zIndex, disableInteractions);
        this.elements = elements;
        if (this.elements == null) {
            this.elements = [];
        }
    }

    addElement(element) {
        if (this.elements.indexOf(element) === -1) {
            this.elements.push(element);
        }
    }

    removeElement(element) {
        var idx = this.elements.indexOf(element);
        if (idx !== -1) {
            this.elements.splice(idx, 1);
        }
    }

    setVisible(visible) {
        super.setVisible(visible);

        for (var e = 0; e < this.elements.length; e++) {
            this.elements[e].setVisible(visible);
        }
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        for (var e = 0; e < this.elements.length; e++) {
            this.elements[e].render(ctx, scaleFun);
        }
    }
}

// ----------------------------------------------------------------------------
class MapOlElement extends AbstractRenderElement {

    constructor(id, image) {
        super(id, null);
        this.image = image;
        this.imageSrcOrg = image.currentSrc;
        // this is a hack : the image to be loaded is inside the subfolder where with the name of the image without the extension.
        this.URLImageParts = this.imageSrcOrg.split('\\').pop().split('/');
        this.filenameParts = this.URLImageParts.slice(-1).pop().split('.');
        this.imageUrl = this.imageSrcOrg.replace('.jpg', '') + '/' + this.filenameParts[0] + '.jpg';
        this.geojson = this.imageUrl.replace('.jpg', '.geojson');
        this.timeCreated = new Date();
        this.createMap();
    }

    getTimeCreated() {
        return this.timeCreated;
    }

    render() {
        // this.vectorLayer1.clear(true);
        // this.vectorLayer1.redraw(true);
        this.vectorLayerSource.refresh({force: true});
    }

    createMap() {
        var map, view, staticImage;
        var image = this.image;
        var imageUrl = this.imageUrl;
        var geojson = this.geojson;
        var self = this;

        var canadaStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: [0, 0, 0, 0]
            }),
            stroke: new ol.style.Stroke({
                color: [255, 0, 0, 0.8],
                width: 1,
                lineCap: 'round'
            })
        });

        var canadaStyleAnnoted = new ol.style.Style({
            fill: new ol.style.Fill({
                color: [148, 162, 177, 0.5]
            }),
            stroke: new ol.style.Stroke({
                color: [255, 0, 0, 0.8],
                width: 1,
                lineCap: 'round'
            })
        });
        const selectedCountry = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(200,20,20,0.8)',
                width: 4,
            }),
        });

        var extent = [0, -image.height, image.width, 0];
        var projection = new ol.proj.Projection({
            code: 'xkcd-image',
            units: 'pixels',
            extent: extent,
        });
        staticImage = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                url: imageUrl,
                projection: projection,
                imageExtent: extent
            })

        });

        this.vectorLayerSource = new ol.source.Vector({
            url: geojson,
            format: new ol.format.GeoJSON(),
        });
        this.vectorLayer1 = new ol.layer.Vector({
            source: this.vectorLayerSource,
            // style: canadaStyle
            style: function (feature) {
                // set current tile/annotation selected
                var props = feature.getProperties();
                var location = props['Location'];
                var labels = window.dataHandler.tileLabels(location);
                var xstyle = canadaStyle;
                if (labels.size > 0) {
                    xstyle = canadaStyleAnnoted;
                }
                return xstyle;
            }

        });
        var selectInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            style: function () {
                return selectedCountry;
            }
        });
        var clickInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerClick,
            style: function (feature) {
                // set current tile/annotation selected
                var props = feature.getProperties();
                var location = props['Location'];
                window.dataHandler.tileSelected(location);
                self.render();
                return selectedCountry;
            }
        });
        view = new ol.View({
            projection: projection,
            center: [image.height / 2, -image.width / 2],
            zoom: 1,
        });

        const elImageName = document.createElement('span');
        elImageName.innerHTML = this.filenameParts[0];
        const elContainer = document.createElement('div');
        elContainer.className = 'ol-unselectable ol-control';
        elContainer.appendChild(elImageName);
        elContainer.style = "top: 65px; left: .5em;"
        var myControl = new ol.control.Control({element: elContainer});

        // Instanciate a Map, set the object target to the map DOM id
        map = new ol.Map({
            target: 'gallery',
            // Add the created layer to the Map
            layers: [staticImage, this.vectorLayer1],
            controls: ol.control.defaults().extend([myControl]),
        });

        // Set the view for the map
        map.setView(view);

        map.addInteraction(selectInteraction);

        map.addInteraction(clickInteraction);
    }
}

// ----------------------------------------------------------------------------
class ImageElement
    extends AbstractRenderElement {

    constructor(id, image, viewport, zIndex) {
        super(id, null, zIndex, false);
        this.image = image;
        this.viewport = viewport;

        if (this.image != null) {
            // calculate image bounds
            let imageSize = [this.image.naturalWidth, this.image.naturalHeight];
            let canvasSize = [this.viewport.canvas.width(), this.viewport.canvas.height()];
            let scaleFactor = Math.min(canvasSize[0] / imageSize[0], canvasSize[1] / imageSize[1]);
            let dimensions = [scaleFactor * imageSize[0] / canvasSize[0], scaleFactor * imageSize[1] / canvasSize[1]];

            // define valid canvas area as per image offset
            this.bounds = [(1 - dimensions[0]) / 2, (1 - dimensions[1]) / 2, dimensions[0], dimensions[1]];
            this.viewport.setValidArea(this.bounds);
        }
        this.timeCreated = new Date();

        // re-render
        this.viewport.render();
    }

    getNaturalImageExtent() {
        return this.naturalImageExtent;
    }

    getTimeCreated() {
        return this.timeCreated;
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        var targetCoords = scaleFun([0, 0, 1, 1], 'validArea');
        if (this.image != null) {
            ctx.drawImage(this.image, targetCoords[0], targetCoords[1],
                targetCoords[2],
                targetCoords[3]);

        } else {
            // loading failed
            let text = 'Loading failed.';
            ctx.fillStyle = window.styles.background;
            ctx.fillRect(targetCoords[0], targetCoords[1], targetCoords[2], targetCoords[3]);
            ctx.font = '20px sans-serif';
            var dimensions = ctx.measureText(text);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(text, targetCoords[2] / 2 - dimensions.width / 2, targetCoords[3] / 2);
        }
    }
}


class HoverTextElement extends AbstractRenderElement {

    constructor(id, hoverText, position, reference, style, zIndex, disableInteractions) {
        super(id, style, zIndex, disableInteractions);
        this.text = hoverText;
        this.position = position;
        this.reference = reference;
        if (this.style.textColor == null || this.style.textColor == undefined) {
            this.style['textColor'] = window.styles.hoverText.text.color;
        }
    }

    setProperty(propertyName, value) {
        super.setProperty(propertyName, value);
        if (propertyName === 'color') {
            this.style.fillColor = window.addAlpha(value, this.style.fillOpacity);
        }
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        if (this.text == null) return;
        var hoverPos = scaleFun(this.position, this.reference);
        ctx.font = window.styles.hoverText.text.fontSizePix + 'px ' + window.styles.hoverText.text.fontStyle;
        var dimensions = ctx.measureText(this.text);
        dimensions.height = window.styles.hoverText.box.height;
        dimensions = [dimensions.width + 8, dimensions.height];
        var offsetH = window.styles.hoverText.offsetH;

        if (this.style.fillColor != null) {
            ctx.fillStyle = this.style.fillColor;
            ctx.fillRect(offsetH + hoverPos[0] - 4, hoverPos[1] - (dimensions[1] / 2 + 4), dimensions[0] + 4, dimensions[1] + 4);
        }
        if (this.style.strokeColor != null && this.style.lineWidth != null) {
            ctx.strokeStyle = this.style.strokeColor;
            ctx.lineWidth = this.style.lineWidth;
            ctx.setLineDash([]);
            ctx.strokeRect(offsetH + hoverPos[0] - 4, hoverPos[1] - (dimensions[1] / 2 + 4), dimensions[0] + 4, dimensions[1] + 4);
        }
        ctx.fillStyle = this.style.textColor;
        ctx.fillText(this.text, offsetH + hoverPos[0], hoverPos[1]);
    }
}


class PointElement extends AbstractRenderElement {

    constructor(id, x, y, style, unsure, zIndex, disableInteractions) {
        super(id, style, zIndex, disableInteractions);
        if (!this.style.hasOwnProperty('fillColor') && this.style.hasOwnProperty('color')) {
            this.style['fillColor'] = window.addAlpha(this.style.color, this.style.fillOpacity);
        }
        this.x = x;
        this.y = y;
        this.unsure = unsure;

        this.isValid = (x != null && y != null);
    }

    setProperty(propertyName, value) {
        super.setProperty(propertyName, value);
        if (propertyName === 'color') {
            this.style.fillColor = window.addAlpha(value, this.style.fillOpacity);
        }
    }

    getGeometry() {
        return {
            'type': 'point',
            'x': this.x,
            'y': this.y,
            'unsure': this.unsure
        };
    }

    /* interaction events */
    _mousedown_event(event, viewport, force) {
        if (!this.visible ||
            !force && (!([ACTIONS.DO_NOTHING, ACTIONS.ADD_ANNOTATION].includes(window.uiControlHandler.getAction())))) return;
        this.mousePos_current = viewport.getRelativeCoordinates(event, 'validArea');
        this.mouseDrag = (event.which === 1);
        var tolerance = viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
        if (this.euclideanDistance(this.mousePos_current) <= tolerance) {
            viewport.canvas.css('cursor', 'move');
        }
    }

    _mousemove_event(event, viewport, force) {
        /*
            On mousemove, we update the target coordinates and the point:
            - always: update cursor
            - if drag and within distance to point: move it
        */
        if (!this.visible) return;
        var coords = viewport.getRelativeCoordinates(event, 'validArea');
        if (this.mousePos_current == null) {
            this.mousePos_current = coords;
        }
        var mpc = this.mousePos_current;
        var tolerance = viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
        if (this.mouseDrag && this.euclideanDistance(mpc) <= tolerance) {
            // move point
            this.setProperty('x', this.x + coords[0] - mpc[0]);
            this.setProperty('y', this.y + coords[1] - mpc[1]);

            // update timestamp
            this.lastUpdated = new Date();

            // update cursor
            viewport.canvas.css('cursor', 'move');
        }

        // update current mouse pos
        this.mousePos_current = coords;

        // set to user-modified
        this.changed = true;
    }

    _mouseup_event(event, viewport, force) {
        this.mouseDrag = false;
        if (!this.visible ||
            !force && (!(window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING ||
                window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION)) ||
            (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION && window.uiControlHandler.burstMode)) return;

        var mousePos = viewport.getRelativeCoordinates(event, 'validArea');

        // activate if position within tolerance
        var tolerance = viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
        if (this.euclideanDistance(mousePos) <= tolerance) {
            this.setActive(true, viewport);
        } else {
            this.setActive(false, viewport);
        }
    }

    _mouseleave_event(event, viewport, force) {
        this.mouseDrag = false;
        if (force || (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION && !window.uiControlHandler.burstMode)) {
            window.uiControlHandler.setAction(ACTIONS.DO_NOTHING);
        }
    }

    _get_active_handle_callback(type, viewport) {
        var self = this;
        if (type === 'mousedown') {
            return function (event) {
                self._mousedown_event(event, viewport, false);
            };

        } else if (type === 'mousemove') {
            return function (event) {
                self._mousemove_event(event, viewport, false);
            }

        } else if (type === 'mouseup') {
            return function (event) {
                self._mouseup_event(event, viewport, false);
            }
        } else if (type === 'mouseleave') {
            return function (event) {
                self._mouseleave_event(event, viewport, false);
            }
        }
    }

    setActive(active, viewport) {
        /*
            Sets the 'active' property to the given value.
        */
        if (!this.disableInteractions) {
            super.setActive(active, viewport);
            if (active) {
                viewport.addCallback(this.id, 'mousedown', this._get_active_handle_callback('mousedown', viewport));
                viewport.addCallback(this.id, 'mousemove', this._get_active_handle_callback('mousemove', viewport));
                viewport.addCallback(this.id, 'mouseup', this._get_active_handle_callback('mouseup', viewport));
                viewport.addCallback(this.id, 'mouseleave', this._get_active_handle_callback('mouseleave', viewport));
            } else {

                // remove active properties
                viewport.removeCallback(this.id, 'mousedown');
                viewport.removeCallback(this.id, 'mousemove');
                viewport.removeCallback(this.id, 'mouseup');
                viewport.removeCallback(this.id, 'mouseleave');
                this.mouseDrag = false;
            }
        }
    }

    registerAsCallback(viewport) {
        /*
            Adds this instance to the viewport.
            This makes the entry user-modifiable in terms of position.
        */
        if (!this.disableInteractions)
            viewport.addCallback(this.id, 'mouseup', this._get_active_handle_callback('mouseup', viewport));
    }

    deregisterAsCallback(viewport) {
        this.setActive(false, viewport);
        viewport.removeCallback(this.id, 'mouseup');
    }

    render(ctx, scaleFun) {
        if (!this.visible || this.x == null || this.y == null) return;

        var coords = scaleFun([this.x, this.y], 'validArea');

        // draw actual point
        ctx.fillStyle = window.addAlpha(this.style.fillColor, this.style.fillOpacity);
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], this.style.pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();

        // if active: also draw outline
        if (this.isActive) {
            ctx.strokeStyle = window.addAlpha(this.style.fillColor, this.style.lineOpacity);
            ctx.lineWidth = 4;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(coords[0], coords[1], this.style.pointSize + 6, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }

        // unsure flag
        if (this.unsure) {
            var text = 'unsure';
            var scaleFactors = scaleFun([0, 0, ctx.canvas.width, ctx.canvas.height], 'canvas', true).slice(2, 4);
            ctx.font = window.styles.hoverText.text.fontSizePix * scaleFactors[0] + 'px ' + window.styles.hoverText.text.fontStyle;
            var dimensions = ctx.measureText(text);
            dimensions.height = window.styles.hoverText.box.height;
            dimensions = [dimensions.width + 8, dimensions.height * scaleFactors[1]];
            ctx.setLineDash([]);
            ctx.fillStyle = this.style.fillColor;
            ctx.fillRect(coords[0] + 4, coords[1] - (dimensions[1]), dimensions[0] + 8, dimensions[1]);
            ctx.fillStyle = window.styles.hoverText.text.color;
            ctx.fillText(text, coords[0] + 12, coords[1] - dimensions[1] / 2 + 4);
        }
    }

    euclideanDistance(that) {
        return Math.sqrt(Math.pow(this.x - that[0], 2) + Math.pow(this.y - that[1], 2));
    }

    isInDistance(coordinates, tolerance) {
        /*
            Returns true if the point is within a tolerance's distance
            of the provided coordinates.
        */
        return this.euclideanDistance(coordinates) <= tolerance;
    }
}


class LineElement extends AbstractRenderElement {

    constructor(id, startX, startY, endX, endY, style, unsure, zIndex, disableInteractions) {
        super(id, style, zIndex, disableInteractions);
        if (!this.style.hasOwnProperty('strokeColor') && this.style.hasOwnProperty('color')) {
            this.style['strokeColor'] = window.addAlpha(this.style.color, this.style.lineOpacity);
        }
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.unsure = unsure;

        this.isValid = (startX != null && startY != null && endX != null && endY != null);
    }

    setProperty(propertyName, value) {
        super.setProperty(propertyName, value);
        if (propertyName === 'color') {
            this.style.strokeColor = window.addAlpha(value, this.style.lineOpacity);
        }
    }

    getGeometry() {
        return {
            'type': 'line',
            'startX': this.startX,
            'startY': this.startY,
            'endX': this.endX,
            'endY': this.endY,
            'unsure': this.unsure
        };
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        if (this.startX == null || this.startY == null ||
            this.endX == null || this.endY == null)
            return;

        var startPos = scaleFun([this.startX, this.startY], 'validArea');
        var endPos = scaleFun([this.endX, this.endY], 'validArea');

        if (this.style.strokeColor != null) ctx.strokeStyle = this.style.strokeColor;
        if (this.style.lineWidth != null) ctx.lineWidth = this.style.lineWidth;
        ctx.setLineDash(this.style.lineDash);
        ctx.beginPath();
        ctx.moveTo(startPos[0], startPos[1]);
        ctx.lineTo(endPos[0], endPos[1]);
        ctx.stroke();
        ctx.closePath();
    }
}


class RectangleElement extends PointElement {

    constructor(id, x, y, width, height, style, unsure, zIndex, disableInteractions) {
        super(id, x, y, style, unsure, zIndex, disableInteractions);
        if (!this.style.hasOwnProperty('strokeColor') && this.style.hasOwnProperty('color')) {
            this.style['strokeColor'] = window.addAlpha(this.style.color, this.style.lineOpacity);
        }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.isValid = (x != null && y != null && width != null && height != null);
        this.isActive = false;
    }

    setProperty(propertyName, value) {
        super.setProperty(propertyName, value);
        if (propertyName === 'color') {
            this.style.strokeColor = window.addAlpha(value, this.style.lineOpacity);
        }
    }

    getGeometry() {
        return {
            'type': 'rectangle',
            'x': this.x,
            'y': this.y,
            'width': this.width,
            'height': this.height,
            'unsure': this.unsure
        };
    }

    getExtent() {
        return [this.x - this.width / 2, this.y - this.height / 2, this.x + this.width / 2, this.y + this.height / 2];
    }

    containsPoint(coordinates) {
        var extent = this.getExtent();
        return (coordinates[0] >= extent[0] && coordinates[0] <= extent[2]) &&
            (coordinates[1] >= extent[1] && coordinates[1] <= extent[3]);
    }

    isInDistance(coordinates, tolerance) {
        /*
            Returns true if any parts of the bounding box are
            within a tolerance's distance of the provided coordinates.
        */
        var extentsTolerance = [this.x - this.width / 2 - tolerance, this.y - this.height / 2 - tolerance, this.x + this.width / 2 + tolerance, this.y + this.height / 2 + tolerance];
        return (coordinates[0] >= extentsTolerance[0] && coordinates[0] <= extentsTolerance[2]) &&
            (coordinates[1] >= extentsTolerance[1] && coordinates[1] <= extentsTolerance[3]);
    }

    _createResizeHandles() {
        /*
            Returns small drawable rectangles at the corners
            and sides of the rectangle.
        */
        if (this.resizeHandles != null) {
            return this.resizeHandles;
        }

        var self = this;
        var getHandle = function (x, y) {
            return new ResizeHandle(
                self.id + '_resize_' + x + '_' + y,
                x, y,
                1);
        }
        var handles = [];

        // corners
        handles.push(getHandle(this.x - this.width / 2, this.y - this.height / 2));
        handles.push(getHandle(this.x - this.width / 2, this.y + this.height / 2));
        handles.push(getHandle(this.x + this.width / 2, this.y - this.height / 2));
        handles.push(getHandle(this.x + this.width / 2, this.y + this.height / 2));

        // sides
        handles.push(getHandle(this.x, this.y - this.height / 2));
        handles.push(getHandle(this.x, this.y + this.height / 2));
        handles.push(getHandle(this.x - this.width / 2, this.y));
        handles.push(getHandle(this.x + this.width / 2, this.y));

        this.resizeHandles = new ElementGroup(this.id + '_resizeHandles', handles);
    }

    _updateResizeHandles() {
        if (this.resizeHandles == null) return;
        this.resizeHandles.elements[0].setProperty('x', this.x - this.width / 2);
        this.resizeHandles.elements[0].setProperty('y', this.y - this.height / 2);
        this.resizeHandles.elements[1].setProperty('x', this.x - this.width / 2);
        this.resizeHandles.elements[1].setProperty('y', this.y + this.height / 2);
        this.resizeHandles.elements[2].setProperty('x', this.x + this.width / 2);
        this.resizeHandles.elements[2].setProperty('y', this.y - this.height / 2);
        this.resizeHandles.elements[3].setProperty('x', this.x + this.width / 2);
        this.resizeHandles.elements[3].setProperty('y', this.y + this.height / 2);
        this.resizeHandles.elements[4].setProperty('x', this.x);
        this.resizeHandles.elements[4].setProperty('y', this.y - this.height / 2);
        this.resizeHandles.elements[5].setProperty('x', this.x);
        this.resizeHandles.elements[5].setProperty('y', this.y + this.height / 2);
        this.resizeHandles.elements[6].setProperty('x', this.x - this.width / 2);
        this.resizeHandles.elements[6].setProperty('y', this.y);
        this.resizeHandles.elements[7].setProperty('x', this.x + this.width / 2);
        this.resizeHandles.elements[7].setProperty('y', this.y);
    }

    getClosestHandle(coordinates, tolerance) {
        /*
            Returns one of {'nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'} if the coordinates
            are close to one of the adjustment handles within a given tolerance.
            Returns 'c' if coordinates are not close to handle, but within bounding box.
            Else returns null.
        */

        // check first if cursor is within reach
        if (!this.isInDistance(coordinates, tolerance)) return null;

        var distL = Math.abs((this.x - this.width / 2) - coordinates[0]);
        var distT = Math.abs((this.y - this.height / 2) - coordinates[1]);
        var distR = Math.abs((this.x + this.width / 2) - coordinates[0]);
        var distB = Math.abs((this.y + this.height / 2) - coordinates[1]);

        var distCorner = Math.min(distL, distT, distR, distB);
        var distCenter = Math.sqrt(Math.pow(this.x - coordinates[0], 2) + Math.pow(this.y - coordinates[1], 2));

        if (distCenter < distCorner && distCenter <= tolerance) {
            return 'c';

        } else if (distT <= tolerance) {
            if (distL <= tolerance) return 'nw';
            if (distR <= tolerance) return 'ne';
            return 'n';
        } else if (distB <= tolerance) {
            if (distL <= tolerance) return 'sw';
            if (distR <= tolerance) return 'se';
            return 's';
        } else if (distL <= tolerance) {
            return 'w';
        } else if (distR <= tolerance) {
            return 'e';
        } else if (this.containsPoint(coordinates)) {
            return 'c';
        } else {
            return null;
        }
    }


    /* interaction events */
    _mousedown_event(event, viewport, force) {
        if (!this.visible ||
            !force && (!([ACTIONS.DO_NOTHING, ACTIONS.ADD_ANNOTATION].includes(window.uiControlHandler.getAction())))) return;
        this.mousePos_current = viewport.getRelativeCoordinates(event, 'validArea');
        this.mouseDrag = (event.which === 1);
        this.activeHandle = this.getClosestHandle(this.mousePos_current, Math.min(this.width, this.height) / 3);
        if (this.activeHandle === 'c') {
            // center of a box clicked; set globally so that other active boxes don't falsely resize
            viewport.canvas.css('cursor', 'move');
        }
    }

    _mousemove_event(event, viewport, force) {
        /*
            On mousemove, we update the target coordinates and the bounding box:
            - always: update cursor
            - if drag and close to resize handle: resize rectangle and move resize handles
            - if drag and inside rectangle: move rectangle and resize handles
        */
        if (!this.visible ||
            !force && (!(window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING || window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION)
            )) return;
        var coords = viewport.getRelativeCoordinates(event, 'validArea');
        // var handle = this.getClosestHandle(coords, window.annotationProximityTolerance / Math.min(viewport.canvas.width(), viewport.canvas.height()));
        if (this.mousePos_current == null) {
            this.mousePos_current = coords;
        }
        var mpc = this.mousePos_current;
        var extent = this.getExtent();
        // if(this.activeHandle == null && handle == null && this.mouseDrag) {
        //     // clicked somewhere in a center of a box; move instead of resize
        //      //TODO: this allows moving rectangles even if mouse dragged out in the blue...
        //     this.setProperty('x', this.x + coords[0] - mpc[0]);
        //     this.setProperty('y', this.y + coords[1] - mpc[1]);

        //     // update timestamp
        //     this.lastUpdated = new Date();

        // } else
        if (this.mouseDrag && this.activeHandle != null) {
            // move or resize rectangle
            if (this.activeHandle.includes('w')) {
                var width = extent[2] - mpc[0];
                if (width < 0) {
                    this.activeHandle = this.activeHandle.replace('w', 'e');
                }
                var x = mpc[0] + width / 2;
                this.setProperty('width', width);
                this.setProperty('x', x);
            }
            if (this.activeHandle.includes('e')) {
                var width = mpc[0] - extent[0];
                if (width < 0) {
                    this.activeHandle = this.activeHandle.replace('e', 'w');
                }
                var x = mpc[0] - width / 2;
                this.setProperty('width', width);
                this.setProperty('x', x);
            }
            if (this.activeHandle.includes('n')) {
                var height = extent[3] - mpc[1];
                if (height < 0) {
                    this.activeHandle = this.activeHandle.replace('n', 's');
                }
                var y = mpc[1] + height / 2;
                this.setProperty('height', height);
                this.setProperty('y', y);
            }
            if (this.activeHandle.includes('s')) {
                var height = mpc[1] - extent[1];
                if (height < 0) {
                    this.activeHandle = this.activeHandle.replace('s', 'n');
                }
                var y = mpc[1] - height / 2;
                this.setProperty('height', height);
                this.setProperty('y', y);
            }
            if (this.activeHandle.includes('c')) {
                this.setProperty('x', this.x + coords[0] - mpc[0]);
                this.setProperty('y', this.y + coords[1] - mpc[1]);
            }

            // update timestamp
            this.lastUpdated = new Date();
        } else {
            this.activeHandle = this.getClosestHandle(mpc, Math.min(this.width, this.height) / 3);
        }

        // update resize handles
        this._updateResizeHandles();

        // update cursor
        if (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION || this.activeHandle == null) {
            viewport.canvas.css('cursor', window.uiControlHandler.getDefaultCursor());
        } else if (this.activeHandle == 'c') {
            viewport.canvas.css('cursor', 'move');
        } else {
            viewport.canvas.css('cursor', this.activeHandle + '-resize');
        }

        // update current mouse pos
        this.mousePos_current = coords;

        // set to user-modified
        this.changed = true;
    }

    _mouseup_event(event, viewport, force) {
        this._clamp_min_box_size(viewport);
        if (!this.visible ||
            !force && (!(window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING ||
                window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION))) return;
        var mousePos = viewport.getRelativeCoordinates(event, 'validArea');
        this.activeHandle = this.getClosestHandle(mousePos, Math.min(this.width, this.height) / 3);
        if (this.activeHandle == null) {
            this.setActive(false, viewport);
        } else {
            if (!this.active) {
                this.setActive(true, viewport);
            }
        }

        this.mouseDrag = false;
    }


    _clamp_min_box_size(viewport) {
        // Make sure box is of correct size
        // TODO: does not scale independently of canvas size
        var minWidth = window.minBoxSize_w;
        var minHeight = window.minBoxSize_h;
        var minSize = viewport.transformCoordinates([0, 0, minWidth, minHeight], 'validArea', true).slice(2, 4);
        this.width = Math.max(this.width, minSize[0]);
        this.height = Math.max(this.height, minSize[1]);
    }


    setActive(active, viewport) {
        /*
            Sets the 'active' property to the given value.
            Also draws resize handles to the viewport if active
            and makes them resizable through callbacks.
        */
        if (this.disableInteractions) return;

        super.setActive(active, viewport);
        if (active) {
            this._createResizeHandles();
            viewport.addRenderElement(this.resizeHandles);
            viewport.addCallback(this.id, 'mousedown', this._get_active_handle_callback('mousedown', viewport));
            viewport.addCallback(this.id, 'mousemove', this._get_active_handle_callback('mousemove', viewport));
            viewport.addCallback(this.id, 'mouseup', this._get_active_handle_callback('mouseup', viewport));
            viewport.addCallback(this.id, 'mouseleave', this._get_active_handle_callback('mouseleave', viewport));
        } else {
            // catch and assert min. box size before disabling callback
            this._clamp_min_box_size(viewport);

            // remove active properties
            viewport.removeRenderElement(this.resizeHandles);
            viewport.removeCallback(this.id, 'mousedown');
            viewport.removeCallback(this.id, 'mousemove');
            viewport.removeCallback(this.id, 'mouseup');
            viewport.removeCallback(this.id, 'mouseleave');
            this.mouseDrag = false;
        }
    }


    setVisible(visible) {
        super.setVisible(visible);

        // also propagate to resize handles (if available)
        if (this.resizeHandles != null) {
            this.resizeHandles.setVisible(visible);
        }
    }


    render(ctx, scaleFun) {
        if (!this.visible || this.x == null || this.y == null) return;

        var coords = [this.x - this.width / 2, this.y - this.height / 2, this.width, this.height];
        coords = scaleFun(coords, 'validArea');
        if (this.style.fillColor != null) {
            ctx.fillStyle = this.style.fillColor;
            ctx.fillRect(coords[0], coords[1], coords[2], coords[3]);
        }
        if (this.style.strokeColor != null) {
            ctx.strokeStyle = this.style.strokeColor;
            ctx.lineWidth = this.style.lineWidth;
            ctx.setLineDash(this.style.lineDash);
            ctx.beginPath();
            ctx.strokeRect(coords[0], coords[1], coords[2], coords[3]);
            ctx.closePath();
        }
        if (this.unsure) {
            var text = 'unsure';
            var scaleFactors = scaleFun([0, 0, ctx.canvas.width, ctx.canvas.height], 'canvas', true).slice(2, 4);
            ctx.font = window.styles.hoverText.text.fontSizePix * scaleFactors[0] + 'px ' + window.styles.hoverText.text.fontStyle;
            var dimensions = ctx.measureText(text);
            dimensions.height = window.styles.hoverText.box.height;
            dimensions = [dimensions.width + 8, dimensions.height * scaleFactors[1]];
            ctx.setLineDash([]);
            ctx.fillStyle = this.style.strokeColor;
            ctx.fillRect(coords[0] - 4, coords[1] - (dimensions[1]), dimensions[0] + 4, dimensions[1]);
            ctx.fillStyle = window.styles.hoverText.text.color;
            ctx.fillText(text, coords[0] + 4, coords[1] - dimensions[1] / 2 + 4);
        }
    }
}


class BorderStrokeElement extends AbstractRenderElement {
    /*
        Draws a border around the viewport.
        Specifically intended for classification tasks.
    */
    constructor(id, text, style, unsure, zIndex, disableInteractions) {
        super(id, style, zIndex, disableInteractions);
        if (this.style.textColor == null || this.style.textColor == undefined) {
            this.style['textColor'] = window.styles.hoverText.text.color;
        }
        this.text = text;
        this.unsure = unsure;
        this.changed = true;        // always true; we want to collect all classification entries, since user will screen them anyway
    }

    setProperty(propertyName, value) {
        super.setProperty(propertyName, value);
        if (propertyName === 'color') {
            this.style.strokeColor = window.addAlpha(value, this.style.lineOpacity);
            this.style.fillColor = window.addAlpha(value, this.style.fillOpacity);
            if (value == null || value == undefined) {
                this.text = null;
            }
        }
    }

    getGeometry() {
        return {
            'type': 'label',
            'unsure': this.unsure
        };
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        if (!this.visible) return;
        var scaleFactors = scaleFun([ctx.canvas.width, ctx.canvas.height], 'canvas', true);
        var coords = scaleFun([0, 0, 1, 1], 'canvas');

        if (this.style.strokeColor != null) {
            ctx.strokeStyle = this.style.strokeColor;
            ctx.lineWidth = this.style.lineWidth * scaleFactors[0];
            ctx.setLineDash(this.style.lineDash);
            ctx.beginPath();
            ctx.strokeRect(coords[0], coords[1], coords[2], coords[3]);
            ctx.closePath();
        }

        // show text in bottom left corner
        var text = ''
        if (this.text != null) text = this.text + ' ';
        if (this.unsure) text += '(unsure)';
        if (this.text != null || this.unsure) {
            text = text.trim();
            ctx.fillStyle = window.styles.hoverText.text.color;
            ctx.font = window.styles.hoverText.text.fontSizePix * scaleFactors[0] + 'px ' + window.styles.hoverText.text.fontStyle;
            var dimensions = ctx.measureText(text);
            dimensions.height = window.styles.hoverText.box.height;
            dimensions = [dimensions.width + 8, dimensions.height * scaleFactors[1]]
            ctx.fillStyle = (this.style.strokeColor == null ? '#929292' : this.style.strokeColor);
            ctx.fillRect(coords[0], coords[3] - dimensions[1] / 2 - 4, dimensions[0], dimensions[1] + 8);
            ctx.fillStyle = this.style.textColor;
            ctx.fillText(text, coords[0] + 4, coords[3] - 4);
        }
    }
}


class ResizeHandle extends AbstractRenderElement {
    /*
        Draws a small square at a given position that is fixed in size
        (but not in position), irrespective of scale.
    */
    constructor(id, x, y, zIndex, disableInteractions) {
        super(id, null, zIndex, disableInteractions);
        this.x = x;
        this.y = y;
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        if (!this.visible || this.x == null || this.y == null) return;

        var coords = scaleFun([this.x, this.y], 'validArea');

        var sz = window.styles.resizeHandles.size;

        ctx.fillStyle = window.styles.resizeHandles.fillColor;
        ctx.fillRect(coords[0] - sz / 2, coords[1] - sz / 2, sz, sz);
        ctx.strokeStyle = window.styles.resizeHandles.strokeColor;
        ctx.lineWidth = window.styles.resizeHandles.lineWidth;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.strokeRect(coords[0] - sz / 2, coords[1] - sz / 2, sz, sz);
        ctx.closePath();
    }
}


class PaintbrushElement extends AbstractRenderElement {
    /*
        Convenience class that either displays a square or circle,
        depending on the global setting, over the mouse position.
    */
    constructor(id, x, y, zIndex, disableInteractions) {
        super(id, null, zIndex, disableInteractions);
        this.x = x;
        this.y = y;
    }

    render(ctx, scaleFun) {
        super.render(ctx, scaleFun);
        if (!this.visible || this.x == null || this.y == null) return;
        var coords = scaleFun([this.x, this.y], 'validArea');
        var size = window.uiControlHandler.segmentation_properties.brushSize;
        size = scaleFun(scaleFun([0, 0, size, size], 'canvas', true), 'validArea')[2];

        ctx.strokeStyle = window.styles.paintbrush.strokeColor;
        ctx.lineWidth = window.styles.paintbrush.lineWidth;
        ctx.setLineDash(window.styles.paintbrush.lineDash === undefined ? [] : window.styles.paintbrush.lineDash);
        if (window.uiControlHandler.getBrushType() === 'rectangle') {
            ctx.strokeRect(coords[0] - size / 2, coords[1] - size / 2,
                size, size);
        } else {
            // circle
            ctx.beginPath();
            ctx.arc(coords[0], coords[1], size / 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }
    }
}


class MiniViewport extends AbstractRenderElement {
    /*
        Miniature version of the viewport to be displayed at a given size
        and position on the parent viewport.
        Useful when only a sub-part of the viewport's area is to be shown.
    */
    constructor(id, parentViewport, parentExtent, x, y, size, zIndex, disableInteractions) {
        super(id, null, zIndex, disableInteractions);
        this.parentViewport = parentViewport;
        this.parentExtent = parentExtent;
        this.position = null;
        if (x != null && y != null && size != null)
            this.position = [x, y, size, size];
    }

    getPosition() {
        return this.position;
    }

    setPosition(x, y, size) {
        this.position = [x, y, size, size];
    }


    getParentExtent() {
        return this.parentExtent;
    }

    setParentExtent(extent) {
        this.parentExtent = extent;
    }


    render(ctx, scaleFun) {
        if (this.position == null || this.parentExtent == null) return;
        super.render(ctx, scaleFun);

        // draw parent canvas as an image
        var pos_abs = scaleFun(this.position, 'canvas');
        var parentExtent_abs = scaleFun(this.parentExtent, 'canvas');
        ctx.drawImage(
            this.parentViewport.canvas[0],
            parentExtent_abs[0], parentExtent_abs[1],
            parentExtent_abs[2] - parentExtent_abs[0], parentExtent_abs[3] - parentExtent_abs[1],
            pos_abs[0], pos_abs[1],
            pos_abs[2], pos_abs[3]
        )
    }
}


class MiniMap extends AbstractRenderElement {
    /*
        The MiniMap, unlike the MiniViewport, actually re-draws the
        canvas elements and also offers an interactive rectangle, showing
        the position of the parent viewport's current extent.
    */
    constructor(id, parentViewport, x, y, size, interactive, zIndex, disableInteractions) {
        super(id, null, zIndex, disableInteractions);
        this.parentViewport = parentViewport;

        this.position = null;
        if (x != null && y != null && size != null)
            this.position = [x, y, size, size];

        if (interactive)
            this._setup_interactions();
    }

    _mousedown_event(event) {
        if (this.position == null || this.pos_abs == null) return;

        // check if mousedown over mini-rectangle
        var mousePos = this.parentViewport.getAbsoluteCoordinates(event);
        var extent_parent = this.minimapScaleFun(this.parentViewport.getViewport(), 'canvas');

        //TODO: something's still buggy here...

        if (mousePos[0] >= extent_parent[0] && mousePos[1] >= extent_parent[1] &&
            mousePos[0] < (extent_parent[0] + extent_parent[1]) &&
            mousePos[1] < (extent_parent[1] + extent_parent[2])) {

            this.mousePos = mousePos;
            this.mouseDown = true;
        }
    }

    _mousemove_event(event) {
        if (this.position == null || this.pos_abs == null || !this.mouseDown) return;

        // determine difference to previous parent extent
        var newMousePos = this.parentViewport.getAbsoluteCoordinates(event);
        var diffX = (newMousePos[0] - this.mousePos[0]);
        var diffY = (newMousePos[1] - this.mousePos[1]);
        this.mousePos = newMousePos;

        // backproject differences to full canvas size
        var diffProj = this.minimapScaleFun([0, 0, diffX, diffY], 'canvas', true).slice(2, 4);
        var vp = this.parentViewport.getViewport();

        // apply new viewport
        vp[0] += diffProj[0];
        vp[1] += diffProj[1];
        this.parentViewport.setViewport(vp);
    }

    _mouseup_event(event) {
        this.mouseDown = false;
    }

    _mouseleave_event(event) {
        this.mouseDown = false;
    }

    __get_callback(type) {
        var self = this;
        if (type === 'mousedown') {
            return function (event) {
                self._mousedown_event(event);
            };
        } else if (type === 'mousemove') {
            return function (event) {
                self._mousemove_event(event);
            };
        } else if (type === 'mouseup') {
            return function (event) {
                self._mouseup_event(event);
            };
        } else if (type === 'mouseleave') {
            return function (event) {
                self._mouseleave_event(event);
            };
        }
    }

    _setup_interactions() {
        /*
            Makes parent viewport move on drag of extent rectangle.
        */
        if (this.disableInteractions) return;

        this.mouseDown = false;
        this.parentViewport.addCallback(this.id, 'mousedown', this.__get_callback('mousedown'));
        this.parentViewport.addCallback(this.id, 'mousemove', this.__get_callback('mousemove'));
        this.parentViewport.addCallback(this.id, 'mouseup', this.__get_callback('mouseup'));
        // this.parentViewport.addCallback(this.id, 'mouseleave', this.__get_callback('mouseleave'));
    }

    getPosition() {
        return this.position;
    }

    setPosition(x, y, size) {
        this.position = [x, y, size, size];
    }


    minimapScaleFun(coordinates, target, backwards) {
        /*
            Transforms coordinates to this minimap's area.
        */
        var coords_out = coordinates.slice();

        if (backwards) {

            // un-shift position
            coords_out[0] -= this.pos_abs[0];
            coords_out[1] -= this.pos_abs[1];

            var canvasSize = [this.pos_abs[2], this.pos_abs[3]];
            if (target === 'canvas') {
                coords_out[0] /= canvasSize[0];
                coords_out[1] /= canvasSize[1];
                if (coords_out.length == 4) {
                    coords_out[2] /= canvasSize[0];
                    coords_out[3] /= canvasSize[1];
                }

            } else if (target === 'validArea') {
                coords_out[0] /= canvasSize[0];
                coords_out[1] /= canvasSize[1];
                if (coords_out.length == 4) {
                    coords_out[2] /= canvasSize[0];
                    coords_out[3] /= canvasSize[1];
                }
            }
        } else {
            var canvasSize = [this.pos_abs[2], this.pos_abs[3]];
            if (target === 'canvas') {
                coords_out[0] *= canvasSize[0];
                coords_out[1] *= canvasSize[1];
                if (coords_out.length == 4) {
                    coords_out[2] *= canvasSize[0];
                    coords_out[3] *= canvasSize[1];
                }
            } else if (target === 'validArea') {
                coords_out[0] *= canvasSize[0];
                coords_out[1] *= canvasSize[1];
                if (coords_out.length == 4) {
                    coords_out[2] *= canvasSize[0];
                    coords_out[3] *= canvasSize[1];
                }
            }

            // shift position
            coords_out[0] += this.pos_abs[0];
            coords_out[1] += this.pos_abs[1];

            // clamp coordinates to minimap extent
            coords_out[0] = Math.max(coords_out[0], this.pos_abs[0]);
            coords_out[1] = Math.max(coords_out[1], this.pos_abs[1]);
            if (coords_out.length == 4) {
                coords_out[0] = Math.min(coords_out[0], this.pos_abs[0] + this.pos_abs[2] - coords_out[2]);
                coords_out[1] = Math.min(coords_out[1], this.pos_abs[1] + this.pos_abs[3] - coords_out[3]);
            } else {
                coords_out[0] = Math.min(coords_out[0], this.pos_abs[0] + this.pos_abs[2]);
                coords_out[1] = Math.min(coords_out[1], this.pos_abs[1] + this.pos_abs[3]);
            }
        }
        return coords_out;
    }

    render(ctx, scaleFun) {
        if (!this.visible || this.position == null) return;
        super.render(ctx, scaleFun);

        // position of minimap on parent viewport
        this.pos_abs = scaleFun(this.position, 'canvas');

        // border and background
        ctx.fillStyle = window.styles.minimap.background.fillColor;
        ctx.strokeStyle = window.styles.minimap.background.strokeColor;
        ctx.lineWidth = window.styles.minimap.background.lineWidth;
        ctx.setLineDash(window.styles.minimap.background.lineDash);
        roundRect(ctx, this.pos_abs[0] - 2, this.pos_abs[1] - 2,
            this.pos_abs[2] + 4, this.pos_abs[3] + 4,
            5, true, true);

        // elements
        for (var e = 0; e < this.parentViewport.renderStack.length; e++) {

            //TODO: dirty hack to avoid rendering HoverTextElement instances, resize handles and paintbrush
            if (this.parentViewport.renderStack[e].hasOwnProperty('text') ||
                this.parentViewport.renderStack[e] instanceof ElementGroup ||
                this.parentViewport.renderStack[e] instanceof PaintbrushElement) continue;
            this.parentViewport.renderStack[e].render(ctx, (this.minimapScaleFun).bind(this));
        }

        // current extent of parent viewport
        var extent_parent = this.minimapScaleFun(this.parentViewport.getViewport(), 'canvas');
        ctx.fillStyle = window.styles.minimap.viewport.fillColor;
        ctx.strokeStyle = window.styles.minimap.viewport.strokeColor;
        ctx.lineWidth = window.styles.minimap.viewport.lineWidth;
        ctx.setLineDash(window.styles.minimap.viewport.lineDash);
        ctx.fillRect(extent_parent[0], extent_parent[1],
            extent_parent[2], extent_parent[3]);


        // another outlined border for aesthetics
        ctx.strokeStyle = window.styles.minimap.background.strokeColor;
        ctx.lineWidth = window.styles.minimap.background.lineWidth;
        ctx.setLineDash(window.styles.minimap.background.lineDash);
        roundRect(ctx, this.pos_abs[0] - ctx.lineWidth / 2, this.pos_abs[1] - ctx.lineWidth / 2,
            this.pos_abs[2] + ctx.lineWidth, this.pos_abs[3] + ctx.lineWidth,
            5, false, true);
    }
}


class SegmentationElement extends AbstractRenderElement {

    constructor(id, annotationMap, predictionMap, width, height, zIndex, disableInteractions) {
        super(id, null, zIndex, disableInteractions);
        this._create_canvas(annotationMap, predictionMap, width, height);
    }

    _create_canvas(annotationMap, predictionMap, width, height) {
        this.canvas = document.createElement('canvas');
        if (width && height) {
            this.setSize([width, height]);
        }
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // add image data to canvas if available
        if (annotationMap !== undefined && annotationMap !== null) {
            if (predictionMap !== undefined && predictionMap !== null) {
                // both annotations and predictions available; blend if background not ignored
                if (window.segmentation_ignoreUnlabeled) {
                    // unlabeled pixels are ignored: blend predictions in
                    this._blend_maps(window.base64ToBuffer(annotationMap), window.base64ToBuffer(predictionMap));
                } else {
                    // unlabeled pixels are treated as background: do not blend prediction in
                    this._parse_map(window.base64ToBuffer(annotationMap));
                }
            } else {
                // only annotations available
                try {
                    this._parse_map(window.base64ToBuffer(annotationMap));
                } catch (error) {
                    console.error(error);
                }
            }
        } else if (predictionMap !== undefined && predictionMap !== null) {
            // only predictions available
            try {
                this._parse_map(window.base64ToBuffer(predictionMap));
            } catch (error) {
                console.error(error);
            }
        }
    }

    getSize() {
        return [this.canvas.width, this.canvas.height];
    }

    setSize(size) {
        this.canvas.width = size[0];
        this.canvas.height = size[1];
    }


    /* export and conversion functions */
    getGeometry() {
        return {
            'type': 'segmentationMask',
            'segmentationMask': window.bufferToBase64(this._export_map()),
            'width': this.canvas.width,
            'height': this.canvas.height
        };
    }

    _parse_map(indexedData) {
        /*
            Receives an array of pixel values corresponding to class
            indices. Fills the canvas with RGB values of the respective
            class, or zeros if no class match could be found.
        */

        // get current canvas pixel values for a quick template
        var pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = pixels.data;

        // iterate over index data and assign
        var nothing = [0, 0, 0];
        var offset = 0;
        var color = nothing;
        var alpha = 0;
        for (var i = 0; i < indexedData.length; i++) {
            // find label class color at position
            var lc = window.labelClassHandler.getByIndex(indexedData[i]);
            if (lc) {
                color = lc.colorValues;
                alpha = 255;
            } else {
                color = nothing;
                alpha = 0;
            }
            data[offset] = color[0];
            data[offset + 1] = color[1];
            data[offset + 2] = color[2];
            data[offset + 3] = alpha;
            offset += 4;
        }
        this.ctx.putImageData(new ImageData(data, this.canvas.width, this.canvas.height), 0, 0);
    }

    _blend_maps(annotation_indexed, prediction_indexed) {
        /**
         Merges two maps:
         @param annotation_indexed A linear array of size (WxH) corresponding to
         annotations made by the user and holding integer
         class indices at each position.
         @param prediction_indexed A linear array of size (WxH), corresponding to
         predicted classes at each position.

         The result is an array of size (WxHx4) with RGBA values of the two maps
         blended together. For blending, the annotation values are always preferred;
         prediction values are adopted if the annotation values are invalid or <0.
         This array is then set as image data for the canvas.
         */
        //TODO: make more failsafe (e.g. if sizes don't match)

        if (prediction_indexed === undefined || prediction_indexed === null) {
            return this._parse_map(annotation_indexed);
        }

        // get current canvas pixel values for a quick template
        var pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = pixels.data;

        // iterate over index data and assign
        var nothing = [0, 0, 0];
        var offset = 0;
        var color = nothing;
        var alpha = 0;
        for (var i = 0; i < annotation_indexed.length; i++) {
            // find label class color at position
            var lc_anno = window.labelClassHandler.getByIndex(annotation_indexed[i]);
            if (lc_anno) {
                color = lc_anno.colorValues;
                alpha = 255;
            } else {
                // try prediction instead
                var lc_pred = window.labelClassHandler.getByIndex(prediction_indexed[i]);
                if (lc_pred) {
                    color = lc_pred.colorValues;
                    alpha = 255;
                } else {
                    // no prediction; set empty
                    color = nothing;
                    alpha = 0;
                }
            }
            data[offset] = color[0];
            data[offset + 1] = color[1];
            data[offset + 2] = color[2];
            data[offset + 3] = alpha;
            offset += 4;
        }
        this.ctx.putImageData(new ImageData(data, this.canvas.width, this.canvas.height), 0, 0);
    }

    _export_map() {
        /*
            Parses the RGBA canvas map and returns an array with
            pixel values that correspond to the class index at the given position,
            indicated by the canvas color.
            Pixels receive value 0 if no class match could be found.
        */

        // assemble all possible R, G, and B values according to label classes.
        // This is required because of the HTML canvas' color imprecision.
        // TODO: ugly! Replace with something smarter and more efficient...
        var reds = {};
        var greens = {};
        var blues = {};
        for (var lc in window.labelClassHandler.labelClasses) {
            var color = window.getColorValues(window.labelClassHandler.labelClasses[lc].color);
            reds[color[0]] = 1;
            greens[color[1]] = 1;
            blues[color[2]] = 1;
        }
        reds = Object.keys(reds);
        greens = Object.keys(greens);
        blues = Object.keys(blues);
        for (var i = 0; i < reds.length; i++) {
            reds[i] = parseInt(reds[i]);
        }
        for (var i = 0; i < greens.length; i++) {
            greens[i] = parseInt(greens[i]);
        }
        for (var i = 0; i < blues.length; i++) {
            blues[i] = parseInt(blues[i]);
        }
        var validColors = [reds, greens, blues];

        // get pixel values
        var pixels = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = pixels.data;

        // convert to labelclass idx
        var indexedData = [];
        for (var i = 0; i < data.length; i += 4) {
            var colorValues = data.slice(i, i + 3);

            // correct color values if needed
            for (var c = 0; c < colorValues.length; c++) {
                var closest = validColors[c].reduce(function (prev, curr) {
                    return (Math.abs(curr - colorValues[c]) < Math.abs(prev - colorValues[c]) ? curr : prev);
                });
                colorValues[c] = closest;
            }

            // find label class at position
            var lc = window.labelClassHandler.getByColor(colorValues);
            indexedData.push(lc === null || lc === undefined ? 0 : lc.index);
        }
        return new Uint8Array(indexedData);
    }


    /* painting functions */
    _clear_circle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = 'destination-out'
        this.ctx.ellipse(x, y, size[0] / 2, size[1] / 2, 2 * Math.PI, 0, 2 * Math.PI)
        // this.ctx.arc(x, y, radius, 0, Math.PI*2, true);
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.globalCompositeOperation = 'source-over';
    }

    paint(coords, color, brushType, brushSize) {
        this.ctx.fillStyle = color;
        if (brushType === 'rectangle') {
            this.ctx.fillRect(coords[0] - brushSize[0] / 2, coords[1] - brushSize[1] / 2,
                brushSize[0], brushSize[1]);
        } else if (brushType === 'circle') {
            this.ctx.beginPath();
            this.ctx.ellipse(coords[0], coords[1], brushSize[0] / 2, brushSize[1] / 2, 2 * Math.PI, 0, 2 * Math.PI)
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    clear(coords, brushType, brushSize) {
        if (brushType === 'rectangle') {
            this.ctx.clearRect(coords[0] - brushSize[0] / 2, coords[1] - brushSize[1] / 2,
                brushSize[0], brushSize[1]);
        } else if (brushType === 'circle') {
            this._clear_circle(coords[0], coords[1], brushSize)
        }
    }

    clearAll() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(ctx, scaleFun) {
        if (!this.visible) return;
        super.render(ctx, scaleFun);

        var targetCoords = scaleFun([0, 0, 1, 1], 'validArea');

        // draw canvas as an image
        ctx.globalAlpha = window.uiControlHandler.segmentation_properties.opacity;
        ctx.drawImage(
            this.canvas,
            targetCoords[0], targetCoords[1],
            targetCoords[2], targetCoords[3]
        )
        ctx.globalAlpha = 1.0;
    }
}