class Annotation {

    constructor(annotationID, properties, geometryType, type, autoConverted) {
        this.annotationID = annotationID;
        this.geometryType = geometryType;
        this.type = type;
        this.autoConverted = autoConverted;
        this.label = new Set();
        this._parse_properties(properties);
    }

    _parse_properties(properties) {
        if(properties.hasOwnProperty('label') && properties['label'] !== null && properties['label'] !== undefined) {
            if( typeof(properties['label']) === 'string') {
                this.label.add(properties['label']);
            } else if( typeof(properties['label']) === 'object') {
                this.label = new Set(properties['label'])
            }
        } else {
            this.label.clear();
        }
        
        var unsure = false;
        if(properties.hasOwnProperty('unsure')) {
            var unsure = (properties['unsure'] == null || properties['unsure'] == undefined ? false : properties['unsure']);    //TODO: should be property of "Annotation", but for drawing reasons we assign it to the geometry...
        }
        if(!window.enableEmptyClass && this.label.size == 0) {
            // no empty class allowed; assign selected label
            this.label.add(window.labelClassHandler.getActiveClassID());
        }

        if(properties.hasOwnProperty('confidence')) {
            this.confidence = properties['confidence'];
        } else {
            this.confidence = null;
        }

        // drawing styles
        var color = window.labelClassHandler.getColor(this.label.values().next().value);
        var style = JSON.parse(JSON.stringify(window.styles.annotations));  // copy default style
        if(this.type === 'prediction') {
            style = JSON.parse(JSON.stringify(window.styles.predictions));
        } else if(this.autoConverted) {
            // special style for annotations converted from predictions
            style = JSON.parse(JSON.stringify(window.styles.annotations_converted));
        }
        style['strokeColor'] = window.addAlpha(color, style.lineOpacity);
        style['fillColor'] = window.addAlpha(color, style.fillOpacity);

        
        if(this.geometryType === 'segmentationMasks') {
            // Semantic segmentation map
            this.geometry = new SegmentationElement(
                this.annotationID + '_geom',
                properties['segmentationmask'],
                properties['segmentationmask_predicted'],
                properties['width'],
                properties['height']
            );

        } else if(this.geometryType === 'polygons') {
            // Polygon
            throw Error('Polygons not yet implemented.');

        } else if(this.geometryType === 'boundingBoxes') {
            // Bounding Box
            this.geometry = new RectangleElement(
                this.annotationID + '_geom',
                properties['x'], properties['y'],
                properties['width'], properties['height'],
                style,
                unsure);

        } else if(this.geometryType === 'points') {
            // Point
            this.geometry = new PointElement(
                this.annotationID + '_geom',
                properties['x'], properties['y'],
                style,
                unsure
            );
        } else if(this.geometryType === 'labels') {
            // Classification label
            let borderText = this.label.size > 0 ? '' : 'No label';
            window.labelClassHandler.switchoffLabelClasses();

            for (var it = this.label.values(), label= null; label=it.next().value; ) {
                borderText += window.labelClassHandler.getName(label) + ' ';
                var labelClass = window.labelClassHandler.getClass(label);
                window.labelClassHandler.lighthenLabelClass(labelClass);
            }
            if(this.confidence != null) {
                borderText += ' (' + 100*this.confidence + '%)';        //TODO: round to two decimals
            }
            this.geometry = new BorderStrokeElement(
                this.annotationID + '_geom',
                borderText,
                style,
                unsure
            )

        } else {
            throw Error('Unknown geometry type (' + this.geometryType + ').')
        }
    }

    isValid() {
        return this.geometry.isValid;
    }

    isActive() {
        return this.geometry.isActive;
    }

    setActive(active, viewport) {
        this.geometry.setActive(active, viewport);
    }

    getChanged() {
        // returns true if the user has modified the annotation
        return this.geometry.changed;
    }

    getTimeChanged() {
        return this.geometry.getLastUpdated();
    }

    getProperties() {
        return {
            'id' : this.annotationID,
            'type' : (this.type.includes('annotation') ? 'annotation' : 'prediction'),
            'label' : [...this.label], // convert to an array as stringify do not work with Set
            'confidence' : this.confidence,
            'autoConverted': (this.autoConverted === null || this.autoConverted === undefined ? false : this.autoConverted),
            'geometry' : this.geometry.getGeometry()
        };
    }

    getProperty(propertyName) {
        if(this.hasOwnProperty(propertyName)) {
            return this[propertyName];
        }
        return this.geometry.getProperty(propertyName);
    }

    unsetLabel(value) {
        // remove label
        if( value != null ) {
            this.label.delete(value);
        }
        if(this.geometry instanceof BorderStrokeElement) {
            // TODO update label text
        }
    }

    setProperty(propertyName, value) {
        if(propertyName == 'label') {
            // remove label
            if( value !== null ) {
                this.label.add(value);
            }
            if(this.geometry instanceof BorderStrokeElement) {
                // show label text
                if(value == null) {
                    this.geometry.setProperty('color', null);
                    this.geometry.setProperty('text', null);
                } else {
                    this.geometry.setProperty('color', window.labelClassHandler.getColor(value));
                    this.geometry.setProperty('text', window.labelClassHandler.getName(value));
                }
            } else {
                this.geometry.setProperty('color', window.labelClassHandler.getColor(value));
            }
        } else if(this.geometry.hasOwnProperty(propertyName)) {
            this.geometry.setProperty(propertyName, value);
        }
        else if(this.hasOwnProperty(propertyName)) {
            this[propertyName] = value;
        }
    }

    getRenderElement() {
        return this.geometry;
    }

    isVisible() {
        return this.geometry.visible;
    }

    setVisible(visible) {
        if(typeof(visible) === 'number' && !isNaN(this.confidence)) {
            // confidence-based
            this.geometry.setVisible(this.confidence >= visible);
        } else {
            // boolean
            this.geometry.setVisible(visible);
        }
    }

    styleChanged() {
        /**
         * To be called when the global window.styles object
         * has been changed. Updates the new styles to all
         * entries and re-renders them.
         */
        var color = window.labelClassHandler.getColor(this.label.values().next().value);
        var style = JSON.parse(JSON.stringify(window.styles.annotations));  // copy default style
        if(this.type === 'prediction') {
            style = JSON.parse(JSON.stringify(window.styles.predictions));
        } else if(this.autoConverted) {
            // special style for annotations converted from predictions
            style = JSON.parse(JSON.stringify(window.styles.annotations_converted));
        }
        style['strokeColor'] = window.addAlpha(color, style.lineOpacity);
        style['fillColor'] = window.addAlpha(color, style.fillOpacity);

        this.geometry.setProperty('style', style);
    }
}