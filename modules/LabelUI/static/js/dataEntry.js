/*
/*
    Definition of a data entry, as shown on a grid on the screen.

    2019-21 Benjamin Kellenberger
 */

class AbstractDataEntry {
    /*
       Abstract base class for data entries.
    */
    constructor(entryID, properties, disableInteractions) {
        this.entryID = entryID;
        this.canvasID = entryID + '_canvas';
        this.fileName = properties['fileName'];
        this.isGoldenQuestion = (typeof (properties['isGoldenQuestion']) === 'boolean' ? properties['isGoldenQuestion'] : false);
        this.isBookmarked = (typeof (properties['isBookmarked']) === 'boolean' ? properties['isBookmarked'] : false);
        this.numInteractions = 0;
        this.disableInteractions = disableInteractions;

        // for interaction handlers
        this.mouseDown = false;
        this.mouseDrag = false;

        var self = this;
        this.imageEntry = null;
        this._setup_viewport();
        this._setup_markup();
        this.loadingPromise = this._loadImage(this.getImageURI()).then(image => {
            self._createImageEntry(image);
            self._parseLabels(properties);
            self.startTime = new Date();
            self.render();
            return true;
        })
            .catch(error => {
                self._createImageEntry(null);
                self.render();
                return false;
            });
    }

    _click(event) {
        /*
            Click listener to disable active annotations in other
            data entries (unless shift key held down)
        */
        if (event.shiftKey) return;
        window.activeEntryID = this.entryID;
        window.dataHandler.refreshActiveAnnotations();      //TODO: ugly hack...
    }

    _toggleGoldenQuestion() {
        /*
            Posts to the server to flip the bool about the entry
            being a golden question (if user is admin).
        */
        if (!window.isAdmin || window.demoMode) return;

        let self = this;
        self.isGoldenQuestion = !self.isGoldenQuestion;
        let goldenQuestions = {};
        goldenQuestions[self.entryID] = self.isGoldenQuestion;

        return $.ajax({
            url: 'setGoldenQuestions',
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                goldenQuestions: goldenQuestions
            }),
            success: function (data) {
                if (data.hasOwnProperty('status') && data['status'] === 0) {
                    // change successful; set flag accordingly
                    if (data.hasOwnProperty('golden_questions') && data['golden_questions'].hasOwnProperty(self.entryID)) {
                        self.isGoldenQuestion = data['golden_questions'][self.entryID];
                    }
                    if (self.isGoldenQuestion) {
                        self.flag.attr('src', '/static/interface/img/controls/flag_active.svg');
                    } else {
                        self.flag.attr('src', '/static/interface/img/controls/flag.svg');
                    }
                }
            },
            error: function (xhr, message, error) {
                console.error(error);
                window.messager.addMessage('An error occurred while trying to set golden question (message: "' + error + '").', 'error', 0);
            },
            statusCode: {
                401: function (xhr) {
                    return window.renewSessionRequest(xhr, function () {
                        return _toggleGoldenQuestion();
                    });
                }
            }
        })
    }

    _toggleBookmark() {
        /*
            Same for bookmarking, although this is allowed also for
            non-admins.
        */
        if (window.demoMode) return;
        let self = this;
        let bookmarks = {};
        bookmarks[this.entryID] = !this.isBookmarked;

        return $.ajax({
            url: 'setBookmark',
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                bookmarks: bookmarks
            }),
            success: function (data) {
                if (data.hasOwnProperty('bookmarks_success') && data['bookmarks_success'].includes(self.entryID)) {
                    // change successful; set flag accordingly
                    self.isBookmarked = !self.isBookmarked;
                    if (self.isBookmarked) {
                        self.bookmark.attr('src', '/static/interface/img/controls/bookmark_active.svg');    //TODO
                    } else {
                        self.bookmark.attr('src', '/static/interface/img/controls/bookmark.svg');           //TODO
                    }
                } else if (data.hasOwnProperty('errors')) {
                    window.messager.addMessage('Image could not be bookmarked.', 'error', 0);
                }
            },
            error: function (xhr, message, error) {
                console.error(error);
                window.messager.addMessage('An error occurred while trying to bookmark image (message: "' + error + '").', 'error', 0);
            },
            statusCode: {
                401: function (xhr) {
                    return window.renewSessionRequest(xhr, function () {
                        return _toggleBookmark();
                    });
                }
            }
        })
    }

    _setup_viewport() {
        var self = this;
        if (window.dataType === 'images') {
            // create canvas
            this.canvas = $('<canvas id="' + this.canvasID + '" width="' + window.defaultImage_w + '" height="' + window.defaultImage_h + '"></canvas>');
            this.canvas.ready(function () {
                self.viewport.resetViewport();
            });
            this.canvas.css('cursor', window.uiControlHandler.getDefaultCursor());

            this.viewport = new ImageViewport(this.canvas, this.disableInteractions);

        } else {
            // maps
            throw Error('Maps not yet implemented.');
        }
    }

    _addElement(element) {
        if (typeof (this.annotations) !== 'object') {
            // not yet initialized; abort
            return;
        }

        if (!element.isValid()) return;
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            this.annotations[key] = element;
        } else if (element['type'] === 'prediction' && window.showPredictions) {
            this.predictions[key] = element;
        }
        this.viewport.addRenderElement(element.getRenderElement());
    }

    _updateElement(element) {
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            this.annotations[key] = element;
        } else if (element['type'] === 'prediction') {
            this.predictions[key] = element;
        }
        this.viewport.updateRenderElement(
            this.viewport.indexOfRenderElement(element.getRenderElement()),
            element.getRenderElement()
        );
    }

    _removeElement(element) {
        this.viewport.removeRenderElement(element.getRenderElement());
        if (element['type'] === 'annotation') {
            delete this.annotations[element['annotationID']];
        } else if (element['type'] === 'prediction') {
            delete this.predictions[element['annotationID']];
        }
    }

    getAnnotationType() {
        throw Error('Not implemented.');
    }

    convertPredictions() {
        if (typeof (this.predictions_raw) !== 'object' || Object.keys(this.predictions_raw).length === 0) return;

        // remove current annotations that had been converted from predictions
        for (var key in this.annotations) {
            let changed = this.annotations[key].getChanged();
            let autoConverted = this.annotations[key]['autoConverted'];
            if (typeof (autoConverted) === 'boolean' && autoConverted && !changed) {
                // auto-converted and unchanged by user; remove
                this._removeElement(this.annotations[key]);
            }
        }

        let geometryType_anno = String(window.annotationType);

        if (window.annotationType === 'labels') {
            // need image-wide labels
            if (window.predictionType === 'labels') {
                // both annotations and predictions are labels: only convert if user has not yet provided a label
                if (typeof (this.labelInstance) === 'object' && typeof (this.labelInstance.autoConverted) === 'boolean' && !this.labelInstance.autoConverted) {
                    // user has already provided a label; abort
                    return
                }
                let pred = this.predictions_raw[Object.keys(this.predictions_raw)[0]];
                if (pred['confidence'] >= window.carryOverPredictions_minConf) {
                    this.setLabel(pred['label']);
                    this.labelInstance.setProperty('autoConverted', true);
                } else {
                    this.setLabel(null);
                }

            } else if (window.predictionType === 'points' || window.predictionType === 'boundingBoxes') {
                // check carry-over rule
                if (window.carryOverRule === 'maxConfidence') {
                    // select arg max
                    var maxConf = -1;
                    var argMax = null;
                    for (var key in this.predictions_raw) {
                        var predConf = this.predictions_raw[key]['confidence'];
                        if (predConf >= window.carryOverPredictions_minConf && predConf > maxConf) {
                            maxConf = predConf;
                            argMax = key;
                        }
                    }
                    if (argMax != null) {
                        // construct new classification entry
                        let id = this.predictions_raw[key]['id'];
                        let label = this.predictions_raw[key]['label'];
                        let anno = new Annotation(window.getRandomID(), {
                            'id': id,
                            'label': label,
                            'confidence': maxConf
                        }, geometryType_anno, 'annotation', true);
                        this._addElement(anno);
                    }
                } else if (window.carryOverRule === 'mode') {
                    var counts = {};
                    for (var key in this.predictions_raw) {
                        let prediction = new Annotation(window.getRandomID(), this.predictions_raw[key], geometryType_anno, 'prediction');
                        if (!(counts.hasOwnProperty(prediction.label))) {
                            counts[label] = 0;
                        }
                        counts[label] += 1;
                    }
                    // find mode
                    var count = -1;
                    var argMax = null;
                    for (var key in counts) {
                        if (counts[key] > count) {
                            count = counts[key];
                            argMax = key;
                        }
                    }
                    // add new label annotation
                    if (argMax != null) {
                        let anno = new Annotation(window.getRandomID(), {'label': argMax}, geometryType_anno, 'annotation', true);
                        this._addElement(anno);
                    }
                }
            }
        } else if (window.annotationType === window.predictionType) {
            // no conversion required
            for (var key in this.predictions_raw) {
                let props = this.predictions_raw[key];
                if (props['confidence'] >= window.carryOverPredictions_minConf) {
                    let anno = new Annotation(window.getRandomID(), props, geometryType_anno, 'annotation', true);
                    this._addElement(anno);
                }
            }
        } else if (window.annotationType === 'points' && window.predictionType === 'boundingBoxes') {
            // remove width and height
            for (var key in this.predictions_raw) {
                let props = this.predictions_raw[key];
                if (props['confidence'] >= window.carryOverPredictions_minConf) {
                    delete props['width'];
                    delete props['height'];
                    let anno = new Annotation(window.getRandomID(), props, geometryType_anno, 'annotation', true);
                    this._addElement(anno);
                }
            }
        } else if (window.annotationType === 'boundingBoxes' && window.predictionType === 'points') {
            // add default width and height
            for (var key in this.predictions_raw) {
                let props = this.predictions_raw[key];
                if (props['confidence'] >= window.carryOverPredictions_minConf) {
                    props['width'] = window.defaultBoxSize_w;
                    props['height'] = window.defaultBoxSize_h;
                    let anno = new Annotation(window.getRandomID(), props, geometryType_anno, 'annotation', true);
                    this._addElement(anno);
                }
            }
        }
    }

    _parseLabels(properties) {
        /*
            Iterates through properties object's entries "predictions" and "annotations"
            and creates new primitive instances each.
            Might automatically convert predictions and carry them over to the annotations
            if applicable and specified in the project settings.
        */
        let geometryType_pred = String(window.predictionType);
        let geometryType_anno = String(window.annotationType);

        this.predictions = {};
        this.annotations = {};
        let hasAnnotations = (properties.hasOwnProperty('annotations') && Object.keys(properties['annotations']).length > 0);

        // add predictions as static, immutable objects
        for (var key in properties['predictions']) {
            let prediction = new Annotation(key, properties['predictions'][key], geometryType_pred, 'prediction');
            if (prediction.confidence < window.showPredictions_minConf) {
                prediction.setProperty('visible', false);
            }
            this._addElement(prediction);
        }

        if (typeof (properties['predictions']) === 'object') {
            this.predictions_raw = properties['predictions'];
        } else {
            this.predictions_raw = {};
        }

        // convert predictions into annotations where possible and allowed
        this.convertPredictions();

        // add annotations
        if (hasAnnotations) {
            for (var key in properties['annotations']) {
                //TODO: make more failsafe?
                var annotation = new Annotation(key, properties['annotations'][key], geometryType_anno, 'annotation');
                // Only add annotation if it is of the correct type.
                // if(annotation.getAnnotationType() ===this.getAnnotationType()) {     //TODO: disabled for debugging purposes
                this._addElement(annotation);
                // }
            }
        }
    }

    _loadImage(imageURI) {
        return new Promise(resolve => {
            const image = new Image();
            image.addEventListener('load', () => {
                resolve(image);
            });
            image.src = imageURI;
        });
    }

    _createImageEntry(image) {
        this.imageEntry = new ImageElement(this.entryID + '_image', image, this.viewport);
        this.viewport.addRenderElement(this.imageEntry);
    }

    _setup_markup() {
        this.markup = $('<div class="entry"></div>');

        let self = this;

        this.markup.append(this.canvas);

        let imageFooterDiv = $('<div class="image-footer"></div>');

        // file name (if enabled)
        if (window.showImageNames) {

            if (window.showImageURIs) {
                imageFooterDiv.append($('<a href="' + this.getImageURI() + '" target="_blank">' + this.fileName + '</a>'));
            } else {
                imageFooterDiv.append($('<span style="color:white">' + this.fileName + '</span>'));
            }
        }

        if (!this.disableInteractions)
            this.markup.on('click', (self._click).bind(self));

        let flagContainer = $('<div class="flag-container"></div>');
        imageFooterDiv.append(flagContainer);

        // flag for golden questions (if admin)
        if (window.isAdmin && !window.demoMode) {
            this.flag = $('<img class="golden-question-flag" title="toggle golden question" />');
            if (self.isGoldenQuestion) {
                this.flag.attr('src', '/static/interface/img/controls/flag_active.svg');
            } else {
                this.flag.attr('src', '/static/interface/img/controls/flag.svg');
            }
            if (!this.disableInteractions) {
                this.flag.click(function () {
                    // toggle golden question on server
                    self._toggleGoldenQuestion();
                });
            }
            flagContainer.append(this.flag);
        }

        // flag for bookmarking
        if (!window.demoMode) {
            this.bookmark = $('<img class="bookmark" title="toggle bookmark" />');
            if (this.isBookmarked) {
                this.bookmark.attr('src', '/static/interface/img/controls/bookmark_active.svg');
            } else {
                this.bookmark.attr('src', '/static/interface/img/controls/bookmark.svg');
            }
            if (!this.disableInteractions) {
                this.bookmark.click(function () {
                    // toggle bookmark on server
                    self._toggleBookmark();
                });
            }
            flagContainer.append(this.bookmark);
        }

        this.markup.append(imageFooterDiv);
    }

    getImageURI() {
        if (this.fileName.startsWith('/')) {
            // static image; don't prepend data server URI & Co.
            return this.fileName;
        } else {
            return window.dataServerURI + window.projectShortname + '/files/' + this.fileName;
        }
    }

    getProperties(minimal, onlyUserAnnotations) {
        var timeCreated = this.getTimeCreated();
        if (timeCreated != null) timeCreated = timeCreated.toISOString();
        var props = {
            'id': this.entryID,
            'timeCreated': timeCreated,
            'timeRequired': this.getTimeRequired(),
            'numInteractions': this.numInteractions
        };
        props['annotations'] = [];
        for (var key in this.annotations) {
            if (!onlyUserAnnotations || this.annotations[key].getChanged())
                var annoProps = this.annotations[key].getProperties(minimal);

            // append time created and time required
            annoProps['timeCreated'] = this.getTimeCreated();
            var timeRequired = Math.max(0, this.annotations[key].getTimeChanged() - this.getTimeCreated());
            annoProps['timeRequired'] = timeRequired;
            props['annotations'].push(annoProps);
        }
        if (!minimal) {
            props['fileName'] = this.fileName;
            props['predictions'] = {};
            if (!onlyUserAnnotations) {
                for (var key in this.predictions) {
                    props['predictions'][key] = this.predictions[key].getProperties(minimal);
                }
            }
        }
        return props;
    }

    getTimeCreated() {
        // returns the timestamp of the image having successfully loaded
        return (this.imageEntry === null ? null : this.imageEntry.getTimeCreated());
    }

    getTimeRequired() {
        // returns the difference between now() and the annotation's creation
        // date
        return new Date() - this.startTime;
    }

    setLabel(label) {
        for (var key in this.annotations) {
            this.annotations[key].setProperty('label', label);
        }
        this.render();
        this.numInteractions++;

        window.dataHandler.updatePresentClasses();
    }

    setPredictionsVisible(visible) {
        for (var key in this.predictions) {
            this.predictions[key].setVisible(visible);
        }
        this.render();
    }

    setAnnotationsVisible(visible) {
        for (var key in this.annotations) {
            this.annotations[key].setVisible(visible);
        }
        this.render();
    }

    setMinimapVisible(visible) {
        this.viewport.setMinimapVisible(visible);
    }

    setAnnotationsInactive() {
        for (var key in this.annotations) {
            this.annotations[key].setActive(false, this.viewport);
        }
        this.render();
    }

    removeActiveAnnotations() {
        var numRemoved = 0;
        for (var key in this.annotations) {
            if (this.annotations[key].isActive()) {
                this.annotations[key].setActive(false, this.viewport);
                this._removeElement(this.annotations[key]);
                numRemoved++;
            }
        }
        this.render();
        this.numInteractions++;
        window.dataHandler.updatePresentClasses();
        return numRemoved;
    }

    removeAllAnnotations() {
        for (var key in this.annotations) {
            this.annotations[key].setActive(false, this.viewport);
            this._removeElement(this.annotations[key]);
        }
        this.render();
        this.numInteractions++;
        window.dataHandler.updatePresentClasses();
    }

    toggleActiveAnnotationsUnsure() {
        var active = false;
        for (var key in this.annotations) {
            if (this.annotations[key].isActive()) {
                this.annotations[key].setProperty('unsure', !this.annotations[key].getProperty('unsure'));
                active = true;
            }
        }
        this.render();
        this.numInteractions++;
        return active;
    }

    getActiveClassIDs() {
        /*
            Returns distinct label class IDs of all annotations and predictions
            present in the entry.
        */
        var classIDs = {};
        for (var key in this.annotations) {
            var label = this.annotations[key].label;
            if (label != null) classIDs[label] = 1;
        }
        for (var key in this.predictions) {
            var label = this.predictions[key].label;
            if (label != null) classIDs[label] = 1;
        }
        return classIDs;
    }

    styleChanged() {
        for (var key in this.annotations) {
            this.annotations[key].styleChanged();
        }
        for (var key in this.predictions) {
            this.predictions[key].styleChanged();
        }
        this.render();
    }

    render() {
        this.viewport.render();
    }
}

// ----------------------------------------------------------------------------
class AbstractDataEntryEx {
    /*
       Abstract base class for data entries.
    */
    constructor(entryID, properties, disableInteractions) {
        this.entryID = entryID;
        this.canvasID = entryID + '_canvas';
        this.fileName = properties['fileName'];
        this.isGoldenQuestion = (typeof (properties['isGoldenQuestion']) === 'boolean' ? properties['isGoldenQuestion'] : false);
        this.isBookmarked = (typeof (properties['isBookmarked']) === 'boolean' ? properties['isBookmarked'] : false);
        this.numInteractions = 0;
        this.disableInteractions = disableInteractions;
        this.labelInstance = null;

        // for interaction handlers
        this.mouseDown = false;
        this.mouseDrag = false;

        var self = this;
        this.imageEntry = null;
        if (!(this instanceof ClassificationTileEntry)) {
            this._parseLabels(properties);
        }
        this.loadingPromise = this._loadImage(this.getImageURI()).then(image => {
            // TODO check if geojson file exists
            if (this instanceof ClassificationTileEntry) {
                self._createMapOlEntry(image);
            }
            self.startTime = new Date();
            self.render();
            return true;
        })
            .catch(error => {
                self._createImageEntry(null);
                self.render();
                return false;
            });
    }

    _click(event) {
        /*
            Click listener to disable active annotations in other
            data entries (unless shift key held down)
        */
        if (event.shiftKey) return;
        window.activeEntryID = this.entryID;
        window.dataHandler.refreshActiveAnnotations();      //TODO: ugly hack...
    }

    _toggleGoldenQuestion() {
        /*
            Posts to the server to flip the bool about the entry
            being a golden question (if user is admin).
        */
        if (!window.isAdmin || window.demoMode) return;

        let self = this;
        self.isGoldenQuestion = !self.isGoldenQuestion;
        let goldenQuestions = {};
        goldenQuestions[self.entryID] = self.isGoldenQuestion;

        return $.ajax({
            url: 'setGoldenQuestions',
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                goldenQuestions: goldenQuestions
            }),
            success: function (data) {
                if (data.hasOwnProperty('status') && data['status'] === 0) {
                    // change successful; set flag accordingly
                    if (data.hasOwnProperty('golden_questions') && data['golden_questions'].hasOwnProperty(self.entryID)) {
                        self.isGoldenQuestion = data['golden_questions'][self.entryID];
                    }
                    if (self.isGoldenQuestion) {
                        self.flag.attr('src', '/static/interface/img/controls/flag_active.svg');
                    } else {
                        self.flag.attr('src', '/static/interface/img/controls/flag.svg');
                    }
                }
            },
            error: function (xhr, message, error) {
                console.error(error);
                window.messager.addMessage('An error occurred while trying to set golden question (message: "' + error + '").', 'error', 0);
            },
            statusCode: {
                401: function (xhr) {
                    return window.renewSessionRequest(xhr, function () {
                        return _toggleGoldenQuestion();
                    });
                }
            }
        })
    }

    _toggleBookmark() {
        /*
            Same for bookmarking, although this is allowed also for
            non-admins.
        */
        if (window.demoMode) return;
        let self = this;
        let bookmarks = {};
        bookmarks[this.entryID] = !this.isBookmarked;

        return $.ajax({
            url: 'setBookmark',
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                bookmarks: bookmarks
            }),
            success: function (data) {
                if (data.hasOwnProperty('bookmarks_success') && data['bookmarks_success'].includes(self.entryID)) {
                    // change successful; set flag accordingly
                    self.isBookmarked = !self.isBookmarked;
                    if (self.isBookmarked) {
                        self.bookmark.attr('src', '/static/interface/img/controls/bookmark_active.svg');    //TODO
                    } else {
                        self.bookmark.attr('src', '/static/interface/img/controls/bookmark.svg');           //TODO
                    }
                } else if (data.hasOwnProperty('errors')) {
                    window.messager.addMessage('Image could not be bookmarked.', 'error', 0);
                }
            },
            error: function (xhr, message, error) {
                console.error(error);
                window.messager.addMessage('An error occurred while trying to bookmark image (message: "' + error + '").', 'error', 0);
            },
            statusCode: {
                401: function (xhr) {
                    return window.renewSessionRequest(xhr, function () {
                        return _toggleBookmark();
                    });
                }
            }
        })
    }

    _addElement(element) {
        if (typeof (this.annotations) !== 'object') {
            // not yet initialized; abort
            return;
        }

        if (!element.isValid()) return;
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            this.annotations[key] = element;
        } else if (element['type'] === 'prediction' && window.showPredictions) {
            this.predictions[key] = element;
        }
    }

    _updateElement(element) {
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            this.annotations[key] = element;
        } else if (element['type'] === 'prediction') {
            this.predictions[key] = element;
        }
    }

    _removeElement(element) {
        if (element['type'] === 'annotation') {
            delete this.annotations[element['annotationID']];
        } else if (element['type'] === 'prediction') {
            delete this.predictions[element['annotationID']];
        }
    }

    getAnnotationType() {
        throw Error('Not implemented.');
    }

    convertPredictions() {
        if (typeof (this.predictions_raw) !== 'object' || Object.keys(this.predictions_raw).length === 0) return;

        // remove current annotations that had been converted from predictions
        for (var key in this.annotations) {
            let changed = this.annotations[key].getChanged();
            let autoConverted = this.annotations[key]['autoConverted'];
            if (typeof (autoConverted) === 'boolean' && autoConverted && !changed) {
                // auto-converted and unchanged by user; remove
                this._removeElement(this.annotations[key]);
            }
        }

        let geometryType_anno = String(window.annotationType);

        if (window.annotationType === 'labels') {
            // need image-wide labels
            if (window.predictionType === 'labels') {
                // both annotations and predictions are labels: only convert if user has not yet provided a label
                if (typeof (this.labelInstance) === 'object' && typeof (this.labelInstance.autoConverted) === 'boolean' && !this.labelInstance.autoConverted) {
                    // user has already provided a label; abort
                    return
                }
                let pred = this.predictions_raw[Object.keys(this.predictions_raw)[0]];
                if (pred['confidence'] >= window.carryOverPredictions_minConf) {
                    this.setLabel(pred['label']);
                    this.labelInstance.setProperty('autoConverted', true);
                } else {
                    this.setLabel(null);
                }

            } else if (window.predictionType === 'points' || window.predictionType === 'boundingBoxes') {
                // check carry-over rule
                if (window.carryOverRule === 'maxConfidence') {
                    // select arg max
                    var maxConf = -1;
                    var argMax = null;
                    for (var key in this.predictions_raw) {
                        var predConf = this.predictions_raw[key]['confidence'];
                        if (predConf >= window.carryOverPredictions_minConf && predConf > maxConf) {
                            maxConf = predConf;
                            argMax = key;
                        }
                    }
                    if (argMax != null) {
                        // construct new classification entry
                        let id = this.predictions_raw[key]['id'];
                        let label = this.predictions_raw[key]['label'];
                        let anno = new Annotation(window.getRandomID(), {
                            'id': id,
                            'label': label,
                            'confidence': maxConf
                        }, geometryType_anno, 'annotation', true);
                        this._addElement(anno);
                    }
                } else if (window.carryOverRule === 'mode') {
                    var counts = {};
                    for (var key in this.predictions_raw) {
                        let prediction = new Annotation(window.getRandomID(), this.predictions_raw[key], geometryType_anno, 'prediction');
                        if (!(counts.hasOwnProperty(prediction.label))) {
                            counts[label] = 0;
                        }
                        counts[label] += 1;
                    }
                    // find mode
                    var count = -1;
                    var argMax = null;
                    for (var key in counts) {
                        if (counts[key] > count) {
                            count = counts[key];
                            argMax = key;
                        }
                    }
                    // add new label annotation
                    if (argMax != null) {
                        let anno = new Annotation(window.getRandomID(), {'label': argMax}, geometryType_anno, 'annotation', true);
                        this._addElement(anno);
                    }
                }
            }
        } else if (window.annotationType === window.predictionType) {
            // no conversion required
            for (var key in this.predictions_raw) {
                let props = this.predictions_raw[key];
                if (props['confidence'] >= window.carryOverPredictions_minConf) {
                    let anno = new Annotation(window.getRandomID(), props, geometryType_anno, 'annotation', true);
                    this._addElement(anno);
                }
            }
        } else if (window.annotationType === 'points' && window.predictionType === 'boundingBoxes') {
            // remove width and height
            for (var key in this.predictions_raw) {
                let props = this.predictions_raw[key];
                if (props['confidence'] >= window.carryOverPredictions_minConf) {
                    delete props['width'];
                    delete props['height'];
                    let anno = new Annotation(window.getRandomID(), props, geometryType_anno, 'annotation', true);
                    this._addElement(anno);
                }
            }
        } else if (window.annotationType === 'boundingBoxes' && window.predictionType === 'points') {
            // add default width and height
            for (var key in this.predictions_raw) {
                let props = this.predictions_raw[key];
                if (props['confidence'] >= window.carryOverPredictions_minConf) {
                    props['width'] = window.defaultBoxSize_w;
                    props['height'] = window.defaultBoxSize_h;
                    let anno = new Annotation(window.getRandomID(), props, geometryType_anno, 'annotation', true);
                    this._addElement(anno);
                }
            }
        }
    }

    _parseLabels(properties) {
        /*
            Iterates through properties object's entries "predictions" and "annotations"
            and creates new primitive instances each.
            Might automatically convert predictions and carry them over to the annotations
            if applicable and specified in the project settings.
        */
        let geometryType_pred = String(window.predictionType);
        let geometryType_anno = String(window.annotationType);

        this.predictions = {};
        this.annotations = {};
        let hasAnnotations = (properties.hasOwnProperty('annotations') && Object.keys(properties['annotations']).length > 0);

        // add predictions as static, immutable objects
        for (var key in properties['predictions']) {
            let prediction = new Annotation(key, properties['predictions'][key], geometryType_pred, 'prediction');
            if (prediction.confidence < window.showPredictions_minConf) {
                prediction.setProperty('visible', false);
            }
            this._addElement(prediction);
        }

        if (typeof (properties['predictions']) === 'object') {
            this.predictions_raw = properties['predictions'];
        } else {
            this.predictions_raw = {};
        }

        // convert predictions into annotations where possible and allowed
        this.convertPredictions();

        // add annotations
        if (hasAnnotations) {
            for (var key in properties['annotations']) {
                //TODO: make more failsafe?
                var annotation = new Annotation(key, properties['annotations'][key], geometryType_anno, 'annotation');
                // Only add annotation if it is of the correct type.
                // if(annotation.getAnnotationType() ===this.getAnnotationType()) {     //TODO: disabled for debugging purposes
                this._addElement(annotation);
                // }
            }
        }
    }

    _loadImage(imageURI) {
        return new Promise(resolve => {
            const image = new Image();
            image.addEventListener('load', () => {
                resolve(image);
            });
            if (imageURI.indexOf('_tile.jpg') > -1) {
                image.src = imageURI;
            } else {
                resolve(image);
            }
        });
    }

    _createMapOlEntry(image) {
        this.imageEntry = new MapOlElement(this.entryID + '_image', image);
        // this.viewport.addRenderElement(this.imageEntry);
    }

    _setup_markup() {
        this.markup = $('<div class="entry"></div>');

        let self = this;

        this.markup.append(this.canvas);

        let imageFooterDiv = $('<div class="image-footer"></div>');

        // file name (if enabled)
        if (window.showImageNames) {

            if (window.showImageURIs) {
                imageFooterDiv.append($('<a href="' + this.getImageURI() + '" target="_blank">' + this.fileName + '</a>'));
            } else {
                imageFooterDiv.append($('<span style="color:white">' + this.fileName + '</span>'));
            }
        }

        if (!this.disableInteractions)
            this.markup.on('click', (self._click).bind(self));

        let flagContainer = $('<div class="flag-container"></div>');
        imageFooterDiv.append(flagContainer);

        // flag for golden questions (if admin)
        if (window.isAdmin && !window.demoMode) {
            this.flag = $('<img class="golden-question-flag" title="toggle golden question" />');
            if (self.isGoldenQuestion) {
                this.flag.attr('src', '/static/interface/img/controls/flag_active.svg');
            } else {
                this.flag.attr('src', '/static/interface/img/controls/flag.svg');
            }
            if (!this.disableInteractions) {
                this.flag.click(function () {
                    // toggle golden question on server
                    self._toggleGoldenQuestion();
                });
            }
            flagContainer.append(this.flag);
        }

        // flag for bookmarking
        if (!window.demoMode) {
            this.bookmark = $('<img class="bookmark" title="toggle bookmark" />');
            if (this.isBookmarked) {
                this.bookmark.attr('src', '/static/interface/img/controls/bookmark_active.svg');
            } else {
                this.bookmark.attr('src', '/static/interface/img/controls/bookmark.svg');
            }
            if (!this.disableInteractions) {
                this.bookmark.click(function () {
                    // toggle bookmark on server
                    self._toggleBookmark();
                });
            }
            flagContainer.append(this.bookmark);
        }

        this.markup.append(imageFooterDiv);
    }


    getImageURI() {
        if (this.fileName.startsWith('/')) {
            // static image; don't prepend data server URI & Co.
            return this.fileName;
        } else {
            return window.dataServerURI + window.projectShortname + '/files/' + this.fileName;
        }
    }

    getProperties(minimal, onlyUserAnnotations) {
        var timeCreated = this.getTimeCreated();
        if (timeCreated != null) timeCreated = timeCreated.toISOString();
        var props = {
            'id': this.entryID,
            'timeCreated': timeCreated,
            'timeRequired': this.getTimeRequired(),
            'numInteractions': this.numInteractions
        };
        props['annotations'] = [];
        for (var key in this.annotations) {
            if (!onlyUserAnnotations || this.annotations[key].getChanged())
                var annoProps = this.annotations[key].getProperties(minimal);

            // append time created and time required
            annoProps['timeCreated'] = this.getTimeCreated();
            var timeRequired = Math.max(0, this.annotations[key].getTimeChanged() - this.getTimeCreated());
            annoProps['timeRequired'] = timeRequired;
            props['annotations'].push(annoProps);
        }
        if (!minimal) {
            props['fileName'] = this.fileName;
            props['predictions'] = {};
            if (!onlyUserAnnotations) {
                for (var key in this.predictions) {
                    props['predictions'][key] = this.predictions[key].getProperties(minimal);
                }
            }
        }
        return props;
    }

    getTimeCreated() {
        // returns the timestamp of the image having successfully loaded
        return (this.imageEntry === null ? null : this.imageEntry.getTimeCreated());
    }

    getTimeRequired() {
        // returns the difference between now() and the annotation's creation
        // date
        return new Date() - this.startTime;
    }

    setLabel(label) {
        for (var key in this.annotations) {
            this.annotations[key].setProperty('label', label);
        }
        this.render();
        this.numInteractions++;

        window.dataHandler.updatePresentClasses();
    }

    setLabels(labelsObj) {
        labelsObj.forEach((that, idx) => {
            if (Array.isArray(that)) this.setLabels(that);
            else this.setLabel(that.classID)
        });
    }


    updateAnnotations(labelsObj, overwrite) {
        if (overwrite) {
            // removes all labels
            this.removeAllLabel();
        }

        // loop through the labels
        this.setLabels(labelsObj);

        // refresh the labels selected
        this.labelInstance.enlightLabels();

        // refresh the labels selected if fliter active
        let hasClass = $('#filter-selected-label').hasClass('active');
        window.labelClassHandler.filterSelectedLabel(hasClass);
    }

    setPredictionsVisible(visible) {
        for (var key in this.predictions) {
            this.predictions[key].setVisible(visible);
        }
        this.render();
    }

    setAnnotationsVisible(visible) {
        for (var key in this.annotations) {
            this.annotations[key].setVisible(visible);
        }
        this.render();
    }

    setAnnotationsInactive() {
        for (var key in this.annotations) {
            this.annotations[key].setActive(false, this.viewport);
        }
        this.render();
    }

    removeActiveAnnotations() {
        var numRemoved = 0;
        for (var key in this.annotations) {
            if (this.annotations[key].isActive()) {
                this.annotations[key].setActive(false, this.viewport);
                this._removeElement(this.annotations[key]);
                numRemoved++;
            }
        }
        this.render();
        this.numInteractions++;
        window.dataHandler.updatePresentClasses();
        return numRemoved;
    }

    removeAllAnnotations() {
        for (var key in this.annotations) {
            this.annotations[key].setActive(false, this.viewport);
            this._removeElement(this.annotations[key]);
        }
        this.render();
        this.numInteractions++;
        window.dataHandler.updatePresentClasses();
    }

    toggleActiveAnnotationsUnsure() {
        var active = false;
        for (var key in this.annotations) {
            if (this.annotations[key].isActive()) {
                this.annotations[key].setProperty('unsure', !this.annotations[key].getProperty('unsure'));
                active = true;
            }
        }
        this.render();
        this.numInteractions++;
        return active;
    }

    getActiveClassIDs() {
        /*
            Returns distinct label class IDs of all annotations and predictions
            present in the entry.
        */
        var classIDs = {};
        for (var key in this.annotations) {
            var label = this.annotations[key].label;
            if (label != null) classIDs[label] = 1;
        }
        for (var key in this.predictions) {
            var label = this.predictions[key].label;
            if (label != null) classIDs[label] = 1;
        }
        return classIDs;
    }

    styleChanged() {
        for (var key in this.annotations) {
            this.annotations[key].styleChanged();
        }
        for (var key in this.predictions) {
            this.predictions[key].styleChanged();
        }
        this.render();
    }
}

class ClassificationMLEntry extends AbstractDataEntryEx {
    /*
       Implementation for image classification with multilabel.
       Expected keys in 'properties' input:
       - entryID: identifier for the data entry
       - fileName: name of the image file to retrieve from data server
       - predictedLabel: optional, array of label ID strings for model predictions
       - predictedConfidence: optional, float for model prediction confidence

       If predictedLabel is provided, a thin border tinted according to the
       arg max (i.e., the predicted label) is drawn around the image.

       As soon as the user clicks into the image, a thick border is drawn,
       colored w.r.t. the user-selected class. A second click removes the user
       label again.
    */
    constructor(entryID, properties, disableInteractions) {
        super(entryID, properties, disableInteractions);

        //if( this instanceof ClassificationTileEntry )
        //this._setup_markup();
        //super._setup_markup();
        this.loadingPromise.then(response => {
            if (this.labelInstance === null) {
                // add a default, blank instance if nothing has been predicted or annotated yet
                var label = (window.enableEmptyClass ? null : window.labelClassHandler.getActiveClassID());
                this._addElement(new Annotation(window.getRandomID(), {'label': label}, 'labels', 'annotation'));
            }
        });
    }

    getAnnotationType() {
        return 'label';
    }

    _addElement(element) {
        if (typeof (this.annotations) !== 'object') {
            // not yet initialized; abort
            return;
        }

        // allow multi label for classification entry
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            if (Object.keys(this.annotations).length > 0) {
                // replace current annotation
                // var currentKey = Object.keys(this.annotations)[0];
                // this.viewport.removeRenderElement(this.annotations[currentKey]);
                // delete this.annotations[currentKey];
                this.annotations[key].setProperty('label', element['label']);
            } else {
                // add new annotation from existing
                var unsure = element['geometry']['unsure'];
                var anno = new Annotation(key, {
                    'label': element['label'],
                    'unsure': unsure
                }, 'labels', element['type']);
                this.annotations[key] = anno;
                this.labelInstance = anno;
            }

            // flip text color of BorderStrokeElement if needed
            var htFill = this.labelInstance.geometry.getProperty('fillColor');
            if (htFill != null && window.getBrightness(htFill) >= 92) {
                this.labelInstance.geometry.setProperty('textColor', '#000000');
            } else {
                this.labelInstance.geometry.setProperty('textColor', '#FFFFFF');
            }

        } else if (element['type'] === 'prediction' && window.showPredictions) {
            this.predictions[key] = element;
        }

        window.dataHandler.updatePresentClasses();
    }

    _setup_markup() {
        var self = this;
        super._setup_markup();
        $(this.canvas).css('cursor', window.uiControlHandler.getDefaultCursor());

        var htStyle = {
            fillColor: window.styles.hoverText.box.fill,
            textColor: window.styles.hoverText.text.color,
            strokeColor: window.styles.hoverText.box.stroke.color,
            lineWidth: window.styles.hoverText.box.stroke.lineWidth
        };
        this.hoverTextElement = new HoverTextElement(this.entryID + '_hoverText', null, null, 'validArea',
            htStyle,
            5);
        this.viewport.addRenderElement(this.hoverTextElement);

        if (!this.disableInteractions) {
            // click handler
            this.viewport.addCallback(this.entryID, 'mouseup', (function (event) {
                if (window.uiBlocked) return;
                else if (window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING) {
                    if (window.unsureButtonActive) {
                        this.labelInstance.setProperty('unsure', !this.labelInstance.getProperty('unsure'));
                        window.unsureButtonActive = false;
                        this.render();
                    } else {
                        this.toggleUserLabel(event.altKey);
                    }
                }
                this.numInteractions++;
                window.dataHandler.updatePresentClasses();
            }).bind(this));

            // tooltip for label change
            this.viewport.addCallback(this.entryID, 'mousemove', (function (event) {
                if (window.uiBlocked) return;
                var pos = this.viewport.getRelativeCoordinates(event, 'validArea');

                // offset tooltip position if loupe is active
                if (window.uiControlHandler.showLoupe) {
                    pos[0] += 0.2;  //TODO: does not account for zooming in
                }

                this.hoverTextElement.position = pos;
                if (window.uiControlHandler.getAction() in [ACTIONS.DO_NOTHING,
                    ACTIONS.ADD_ANNOTATION,
                    ACTIONS.REMOVE_ANNOTATIONS]) {
                    if (event.altKey) {
                        this.hoverTextElement.setProperty('text', 'mark as unlabeled');
                        this.hoverTextElement.setProperty('fillColor', window.styles.hoverText.box.fill);
                    } else if (window.unsureButtonActive) {
                        this.hoverTextElement.setProperty('text', 'toggle unsure');
                        this.hoverTextElement.setProperty('fillColor', window.styles.hoverText.box.fill);
                    } else if (typeof (this.labelInstance) !== 'object') {
                        this.hoverTextElement.setProperty('text', 'set label to "' + window.labelClassHandler.getActiveClassName() + '"');
                        this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                    } else if (this.labelInstance.label != window.labelClassHandler.getActiveClassID()) {
                        this.hoverTextElement.setProperty('text', 'change label to "' + window.labelClassHandler.getActiveClassName() + '"');
                        this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                    } else {
                        this.hoverTextElement.setProperty('text', null);
                    }
                } else {
                    this.hoverTextElement.setProperty('text', null);
                }

                // flip text color if needed
                var htFill = this.hoverTextElement.getProperty('fillColor');
                if (htFill != null && window.getBrightness(htFill) >= 92) {
                    this.hoverTextElement.setProperty('textColor', '#000000');
                } else {
                    this.hoverTextElement.setProperty('textColor', '#FFFFFF');
                }

                // set active (for e.g. "unsure" functionality)
                if (typeof (self.labelInstance) === 'object') {
                    this.labelInstance.setActive(true);
                }

                this.render();
            }).bind(this));
            // this.canvas.mousemove(function(event) {

            // });
            this.markup.mouseout(function (event) {
                if (window.uiBlocked) return;
                self.hoverTextElement.setProperty('text', null);
                if (typeof (self.labelInstance) === 'object') {
                    self.labelInstance.setActive(false);
                }
                self.render();
            });
        }
    }

    getLabel() {
        if (typeof (this.annotations) !== 'object') {
            return null;
        }
        let entryKey = Object.keys(this.annotations);
        if (entryKey.length === 0) return null;
        return this.annotations[entryKey[0]].getProperty('label');
    }

    removeAllLabel() {
        if (typeof (this.labelInstance) !== 'object') return;

        this.labelInstance.removeAllLabel();

        this.numInteractions++;

        this.render();

        window.dataHandler.updatePresentClasses();

    }

    unsetLabel(label) {
        if (typeof (this.labelInstance) !== 'object') return;

        this.labelInstance.unsetLabel(label);

        this.numInteractions++;

        this.render();

        window.dataHandler.updatePresentClasses();
    }

    setLabel(label) {
        if (typeof (this.labelInstance) !== 'object') {
            // add new annotation
            var anno = new Annotation(window.getRandomID(), {'label': label}, 'labels', 'annotation');
            this._addElement(anno);

        } else {
            this.labelInstance.setProperty('label', label);
            if (label === null) {
                // re-enable auto-conversion of predictions
                this.labelInstance.setProperty('autoConverted', true);
            }
        }
        if (Object.keys(this.annotations).length === 0) {
            // re-add label instance
            this._addElement(this.labelInstance);
        }

        // flip text color of BorderStrokeElement if needed
        var htFill = this.labelInstance.geometry.getProperty('fillColor');
        if (htFill != null && window.getBrightness(htFill) >= 92) {
            this.labelInstance.geometry.setProperty('textColor', '#000000');
        } else {
            this.labelInstance.geometry.setProperty('textColor', '#FFFFFF');
        }
        this.numInteractions++;

        this.render();

        window.dataHandler.updatePresentClasses();
    }

    toggleUserLabel(forceRemove) {
        /*
            Toggles the classification label as follows:
            - if the annotation has no label, it is set to the user-specified class
            - if it has the same label as specified, the label is removed if the background
                class is enabled
            - if it has a different label than specified, the label is changed
            - if forceRemove is true, the label is removed (if background class is enabled)
        */
        if (forceRemove && window.enableEmptyClass) {
            this.setLabel(null);

        } else {
            var activeLabel = window.labelClassHandler.getActiveClassID();
            if (typeof (this.labelInstance) !== 'object') {
                // add new annotation
                var anno = new Annotation(window.getRandomID(), {'label': activeLabel}, 'labels', 'annotation');
                this._addElement(anno);

            } else {
                if (this.labelInstance.label === activeLabel && window.enableEmptyClass) {
                    // same label; disable
                    this.setLabel(null);

                } else {
                    // different label; update
                    this.setLabel(activeLabel);
                }
            }
        }
        this.labelInstance.setProperty('autoConverted', false);
        this.render();

        window.dataHandler.updatePresentClasses();
    }

    removeAllAnnotations() {
        // this is technically not needed for classification; we do it nonetheless for completeness
        for (var key in this.annotations) {
            this.annotations[key].setActive(false, this.viewport);
            this._removeElement(this.annotations[key]);
        }
        if (typeof (this.labelInstance) === 'object') {
            this.labelInstance.setProperty('label', null);
            // re-enable auto-conversion of predictions
            this.labelInstance.setProperty('autoConverted', true);
        }
        this.render();

        window.dataHandler.updatePresentClasses();
    }

    // triggered in the MapOlElement when a tile get selected, the respective ClassificationMLEntry get retrieved and the click function called
    click(entry) {
        // this.toggleUserLabel(false);
        // this._addElement(entry.annotations[0]); // Maybe have to do this ?
        if (window.labelClassHandler.activeLabellingMode == false) {
            window.activeEntryID = this.entryID;
            // multi-labelling mode, select turn on labels.
            // mono-labelling, just do nothing
            this.labelInstance.enlightLabels();
        } else {
            // mono-labelling mode
            // if selected, unselect
            if (window.activeEntryID === this.entryID) {
                window.activeEntryID = null;
            } else {
                // if not selected, select
                window.activeEntryID = this.entryID;
            }
        }
    }

    clearSelection() {
        if (this instanceof ClassificationTileEntry) {
            if (this.imageEntry)
                this.imageEntry.clearSelection();
        }
    }

    setSelectedFeatures(features) {
        if (this instanceof ClassificationTileEntry) {
            if (this.imageEntry)
                this.imageEntry.setSelectedFeatures(features);
        }
    }

    render() {
        if (this instanceof ClassificationTileEntry) {
            if (this.imageEntry)
                this.imageEntry.render();
        }
    }
}

class ClassificationTileEntry extends ClassificationMLEntry {

    constructor(entryID, properties, disableInteractions) {
        super(entryID, properties, disableInteractions);
    }

}


class ClassificationEntry extends AbstractDataEntry {
    /*
       Implementation for image classification.
       Expected keys in 'properties' input:
       - entryID: identifier for the data entry
       - fileName: name of the image file to retrieve from data server
       - predictedLabel: optional, array of label ID strings for model predictions
       - predictedConfidence: optional, float for model prediction confidence

       If predictedLabel is provided, a thin border tinted according to the
       arg max (i.e., the predicted label) is drawn around the image.

       As soon as the user clicks into the image, a thick border is drawn,
       colored w.r.t. the user-selected class. A second click removes the user
       label again.
    */
    constructor(entryID, properties, disableInteractions) {
        super(entryID, properties, disableInteractions);

        this._setup_markup();
        this.loadingPromise.then(response => {
            if (this.labelInstance === null) {
                // add a default, blank instance if nothing has been predicted or annotated yet
                var label = (window.enableEmptyClass ? null : window.labelClassHandler.getActiveClassID());
                this._addElement(new Annotation(window.getRandomID(), {'label': label}, 'labels', 'annotation'));
            }
        });
    }

    getAnnotationType() {
        return 'label';
    }

    _addElement(element) {
        if (typeof (this.annotations) !== 'object') {
            // not yet initialized; abort
            return;
        }

        // allow only one label for classification entry
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            if (Object.keys(this.annotations).length > 0) {
                // replace current annotation
                var currentKey = Object.keys(this.annotations)[0];
                this.viewport.removeRenderElement(this.annotations[currentKey]);
                delete this.annotations[currentKey];
            }

            // add new annotation from existing
            var unsure = element['geometry']['unsure'];
            var anno = new Annotation(key, {'label': element['label'], 'unsure': unsure}, 'labels', element['type']);
            this.annotations[key] = anno;
            this.viewport.addRenderElement(anno.getRenderElement());
            this.labelInstance = anno;

            // flip text color of BorderStrokeElement if needed
            var htFill = this.labelInstance.geometry.getProperty('fillColor');
            if (htFill != null && window.getBrightness(htFill) >= 92) {
                this.labelInstance.geometry.setProperty('textColor', '#000000');
            } else {
                this.labelInstance.geometry.setProperty('textColor', '#FFFFFF');
            }

        } else if (element['type'] === 'prediction' && window.showPredictions) {
            this.predictions[key] = element;
            this.viewport.addRenderElement(element.getRenderElement());
        }

        window.dataHandler.updatePresentClasses();
    }

    _setup_markup() {
        var self = this;
        super._setup_markup();
        $(this.canvas).css('cursor', window.uiControlHandler.getDefaultCursor());

        var htStyle = {
            fillColor: window.styles.hoverText.box.fill,
            textColor: window.styles.hoverText.text.color,
            strokeColor: window.styles.hoverText.box.stroke.color,
            lineWidth: window.styles.hoverText.box.stroke.lineWidth
        };
        this.hoverTextElement = new HoverTextElement(this.entryID + '_hoverText', null, null, 'validArea',
            htStyle,
            5);
        this.viewport.addRenderElement(this.hoverTextElement);

        if (!this.disableInteractions) {
            // click handler
            this.viewport.addCallback(this.entryID, 'mouseup', (function (event) {
                if (window.uiBlocked) return;
                else if (window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING) {
                    if (window.unsureButtonActive) {
                        this.labelInstance.setProperty('unsure', !this.labelInstance.getProperty('unsure'));
                        window.unsureButtonActive = false;
                        this.render();
                    } else {
                        this.toggleUserLabel(event.altKey);
                    }
                }
                this.numInteractions++;
                window.dataHandler.updatePresentClasses();
            }).bind(this));

            // tooltip for label change
            this.viewport.addCallback(this.entryID, 'mousemove', (function (event) {
                if (window.uiBlocked) return;
                var pos = this.viewport.getRelativeCoordinates(event, 'validArea');

                // offset tooltip position if loupe is active
                if (window.uiControlHandler.showLoupe) {
                    pos[0] += 0.2;  //TODO: does not account for zooming in
                }

                this.hoverTextElement.position = pos;
                if (window.uiControlHandler.getAction() in [ACTIONS.DO_NOTHING,
                    ACTIONS.ADD_ANNOTATION,
                    ACTIONS.REMOVE_ANNOTATIONS]) {
                    if (event.altKey) {
                        this.hoverTextElement.setProperty('text', 'mark as unlabeled');
                        this.hoverTextElement.setProperty('fillColor', window.styles.hoverText.box.fill);
                    } else if (window.unsureButtonActive) {
                        this.hoverTextElement.setProperty('text', 'toggle unsure');
                        this.hoverTextElement.setProperty('fillColor', window.styles.hoverText.box.fill);
                    } else if (typeof (this.labelInstance) !== 'object') {
                        this.hoverTextElement.setProperty('text', 'set label to "' + window.labelClassHandler.getActiveClassName() + '"');
                        this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                    } else if (this.labelInstance.label != window.labelClassHandler.getActiveClassID()) {
                        this.hoverTextElement.setProperty('text', 'change label to "' + window.labelClassHandler.getActiveClassName() + '"');
                        this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                    } else {
                        this.hoverTextElement.setProperty('text', null);
                    }
                } else {
                    this.hoverTextElement.setProperty('text', null);
                }

                // flip text color if needed
                var htFill = this.hoverTextElement.getProperty('fillColor');
                if (htFill != null && window.getBrightness(htFill) >= 92) {
                    this.hoverTextElement.setProperty('textColor', '#000000');
                } else {
                    this.hoverTextElement.setProperty('textColor', '#FFFFFF');
                }

                // set active (for e.g. "unsure" functionality)
                if (typeof (self.labelInstance) === 'object') {
                    this.labelInstance.setActive(true);
                }

                this.render();
            }).bind(this));
            // this.canvas.mousemove(function(event) {

            // });
            this.markup.mouseout(function (event) {
                if (window.uiBlocked) return;
                self.hoverTextElement.setProperty('text', null);
                if (typeof (self.labelInstance) === 'object') {
                    self.labelInstance.setActive(false);
                }
                self.render();
            });
        }
    }

    getLabel() {
        if (typeof (this.annotations) !== 'object') {
            return null;
        }
        let entryKey = Object.keys(this.annotations);
        if (entryKey.length === 0) return null;
        return this.annotations[entryKey[0]].getProperty('label');
    }

    setLabel(label) {
        if (typeof (this.labelInstance) !== 'object') {
            // add new annotation
            var anno = new Annotation(window.getRandomID(), {'label': label}, 'labels', 'annotation');
            this._addElement(anno);

        } else {
            this.labelInstance.setProperty('label', label);
            if (label === null) {
                // re-enable auto-conversion of predictions
                this.labelInstance.setProperty('autoConverted', true);
            }
        }
        if (Object.keys(this.annotations).length === 0) {
            // re-add label instance
            this._addElement(this.labelInstance);
        }

        // flip text color of BorderStrokeElement if needed
        var htFill = this.labelInstance.geometry.getProperty('fillColor');
        if (htFill != null && window.getBrightness(htFill) >= 92) {
            this.labelInstance.geometry.setProperty('textColor', '#000000');
        } else {
            this.labelInstance.geometry.setProperty('textColor', '#FFFFFF');
        }
        this.numInteractions++;

        this.render();

        window.dataHandler.updatePresentClasses();
    }

    toggleUserLabel(forceRemove) {
        /*
            Toggles the classification label as follows:
            - if the annotation has no label, it is set to the user-specified class
            - if it has the same label as specified, the label is removed if the background
                class is enabled
            - if it has a different label than specified, the label is changed
            - if forceRemove is true, the label is removed (if background class is enabled)
        */
        if (forceRemove && window.enableEmptyClass) {
            this.setLabel(null);

        } else {
            var activeLabel = window.labelClassHandler.getActiveClassID();
            if (typeof (this.labelInstance) !== 'object') {
                // add new annotation
                var anno = new Annotation(window.getRandomID(), {'label': activeLabel}, 'labels', 'annotation');
                this._addElement(anno);

            } else {
                if (this.labelInstance.label === activeLabel && window.enableEmptyClass) {
                    // same label; disable
                    this.setLabel(null);

                } else {
                    // different label; update
                    this.setLabel(activeLabel);
                }
            }
        }
        this.labelInstance.setProperty('autoConverted', false);
        this.render();

        window.dataHandler.updatePresentClasses();
    }

    removeAllAnnotations() {
        // this is technically not needed for classification; we do it nonetheless for completeness
        for (var key in this.annotations) {
            this.annotations[key].setActive(false, this.viewport);
            this._removeElement(this.annotations[key]);
        }
        if (typeof (this.labelInstance) === 'object') {
            this.labelInstance.setProperty('label', null);
            // re-enable auto-conversion of predictions
            this.labelInstance.setProperty('autoConverted', true);
        }
        this.render();

        window.dataHandler.updatePresentClasses();
    }
}


class PointAnnotationEntry extends AbstractDataEntry {
    /*
        Implementation for point annotations (note: just image coordinates,
        no bounding boxes).
        */
    constructor(entryID, properties, disableInteractions) {
        super(entryID, properties, disableInteractions);
        this._setup_markup();
    }

    getAnnotationType() {
        return 'point';
    }

    setLabel(label) {
        for (var key in this.annotations) {
            if (label === null) {
                this._removeElement(this.annotations[key]);
            } else {
                this.annotations[key].setProperty('label', label);
            }
        }
        this.numInteractions++;
        this.render();
        window.dataHandler.updatePresentClasses();
    }

    _setup_markup() {
        var self = this;
        super._setup_markup();
        this.canvas.css('cursor', window.uiControlHandler.getDefaultCursor());

        var htStyle = {
            fillColor: window.styles.hoverText.box.fill,
            textColor: window.styles.hoverText.text.color,
            strokeColor: window.styles.hoverText.box.stroke.color,
            lineWidth: window.styles.hoverText.box.stroke.lineWidth,
            lineDash: []
        };
        this.hoverTextElement = new HoverTextElement(this.entryID + '_hoverText', null, [0, 0.99], 'canvas',
            htStyle,
            5);
        this.viewport.addRenderElement(this.hoverTextElement);

        // interaction handlers
        if (!this.disableInteractions) {
            this.viewport.addCallback(this.entryID, 'mousedown', (self._canvas_mousedown).bind(self));
            this.viewport.addCallback(this.entryID, 'mousemove', (self._canvas_mousemove).bind(self));
            this.viewport.addCallback(this.entryID, 'mouseup', (self._canvas_mouseup).bind(self));
            this.viewport.addCallback(this.entryID, 'mouseleave', (self._canvas_mouseleave).bind(self));
        }
    }

    _toggleActive(event) {
        /*
            Sets points active or inactive as follows:
            - if a point is close enough to the event's coordinates:
                - and is not active: it is turned active
                - and is active: nothing happens
                Any other point that is active _and_ is close enough to the point stays active.
                Other points that are active and are not near the coordinates get deactivated,
                unless the shift key is held down.
            - if no point is near the coordinates, every single one is deactivated.
        */
        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
        var tolerance = this.viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
        var minDist = 1e9;
        var argMin = null;
        for (var key in this.annotations) {
            var point = this.annotations[key].getRenderElement();
            var dist = point.euclideanDistance(coords);
            if (dist <= tolerance) {
                if (dist < minDist) {
                    minDist = dist;
                    argMin = key;
                }
                if (!(event.shiftKey && this.annotations[key].isActive())) {
                    // deactivate
                    if (this.annotations[key].isVisible()) {
                        this.annotations[key].setActive(false, this.viewport);
                    }
                }
            }
        }

        // handle closest
        if (argMin === null) {
            // deactivate all
            for (var key in this.annotations) {
                if (this.annotations[key].isVisible()) {
                    this.annotations[key].setActive(false, this.viewport);
                }
            }
        } else if (this.annotations[argMin].isVisible()) {
            // set closest one active
            this.annotations[argMin].setActive(true, this.viewport);
        }
    }

    _canvas_mouseout(event) {
        // clear hover text
        if (window.uiBlocked) return;
        this.hoverTextElement.setProperty('text', null);
        this.render();
    }

    _createAnnotation(event) {
        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
        var props = {
            'x': coords[0],
            'y': coords[1],
            'label': window.labelClassHandler.getActiveClassID()
        };
        var anno = new Annotation(window.getRandomID(), props, 'points', 'annotation');
        this._addElement(anno);
        anno.getRenderElement().registerAsCallback(this.viewport);
        anno.getRenderElement().setActive(true, this.viewport);
        // manually fire mousedown event on annotation
        anno.getRenderElement()._mousedown_event(event, this.viewport);
    }

    _deleteActiveAnnotations(event) {
        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
        var minDist = 1e9;
        var argMin = null;
        for (var key in this.annotations) {
            var point = this.annotations[key].getRenderElement();
            var dist = point.euclideanDistance(coords);
            var tolerance = this.viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
            if (dist <= tolerance) {
                if (this.annotations[key].isActive()) {
                    this.annotations[key].getRenderElement().deregisterAsCallback(this.viewport);
                    this._removeElement(this.annotations[key]);
                    return;
                }

                if (dist < minDist) {
                    minDist = dist;
                    argMin = key;
                }
            }
        }

        if (argMin != null) {
            // no active annotation found, but clicked within another one; delete it
            this._removeElement(this.annotations[argMin]);
        }
        window.dataHandler.updatePresentClasses();
    }

    _canvas_mousedown(event) {
        if (window.uiBlocked) return;
        this.mouseDown = true;

        // check functionality
        if (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION) {
            // set all currently active points inactive
            for (var key in this.annotations) {
                if (this.annotations[key].isVisible()) {
                    this.annotations[key].setActive(false, this.viewport);
                }
            }

            // start creating a new point
            this._createAnnotation(event);
        }
        this.render();
    }

    _canvas_mousemove(event) {
        if (window.uiBlocked) return;
        if (this.mouseDown) this.mouseDrag = true;

        var coords = this.viewport.getRelativeCoordinates(event, 'canvas');

        // update hover text
        var hoverText = null;
        switch (window.uiControlHandler.getAction()) {
            case ACTIONS.ADD_ANNOTATION:
                hoverText = 'add new \"' + window.labelClassHandler.getActiveClassName() + '"';
                this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                break;
            case ACTIONS.REMOVE_ANNOTATIONS:
                var numActive = 0;
                for (var key in this.annotations) {
                    if (this.annotations[key].isActive()) numActive++;
                }
                if (numActive > 0) {
                    hoverText = 'Remove ' + numActive + ' annotation';
                    if (numActive > 1) hoverText += 's';
                    this.hoverTextElement.setProperty('fillColor', window.styles.hoverText.box.fill);
                }
                break;
            case ACTIONS.DO_NOTHING:
                // find point near coordinates
                var anno = null;
                var tolerance = this.viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
                for (var key in this.annotations) {
                    if (this.annotations[key].geometry.euclideanDistance(coords) <= tolerance) {
                        anno = this.annotations[key];
                    }
                }
                // set text
                if (anno === undefined || anno === null) {
                    hoverText = null;
                    break;
                }
                if (anno.isActive() && anno.label != window.labelClassHandler.getActiveClassID() && !this.mouseDrag) {
                    hoverText = 'move or change label to "' + window.labelClassHandler.getActiveClassName() + '"';
                    this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                } else {
                    // show current class name of point
                    hoverText = window.labelClassHandler.getName(anno.label);
                    this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getColor(anno.label));
                }
                break;
        }
        // this.hoverTextElement.setProperty('position', coords);

        // flip text color if needed
        var htFill = this.hoverTextElement.getProperty('fillColor');
        if (htFill != null && window.getBrightness(htFill) >= 92) {
            this.hoverTextElement.setProperty('textColor', '#000000');
        } else {
            this.hoverTextElement.setProperty('textColor', '#FFFFFF');
        }

        this.hoverTextElement.setProperty('text', hoverText);

        this.render();
    }

    _canvas_mouseup(event) {
        if (window.uiBlocked) return;

        // check functionality
        if (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION) {
            // new annotation completed
            //TODO: may fire before other rectangle's events, making them unwantedly active while finishing new rect
            // window.uiControlHandler.setAction(ACTIONS.DO_NOTHING);
            this.numInteractions++;

        } else if (window.uiControlHandler.getAction() === ACTIONS.REMOVE_ANNOTATIONS) {
            this._deleteActiveAnnotations(event);
            // window.uiControlHandler.setAction(ACTIONS.DO_NOTHING);
            this.numInteractions++;

        } else if (window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING) {
            // update annotations to current label (if active and no mouse dragging [moving] was performed)
            if (!this.mouseDrag) {
                var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
                var tolerance = this.viewport.transformCoordinates([0, 0, window.annotationProximityTolerance, 0], 'canvas', true)[2];
                for (var key in this.annotations) {
                    if (this.annotations[key].isActive()) {
                        if (event.shiftKey || this.annotations[key].getRenderElement().euclideanDistance(coords) <= tolerance) {
                            this.annotations[key].setProperty('label', window.labelClassHandler.getActiveClassID());
                        }
                    }
                }

                // activate or deactivate
                this._toggleActive(event);
                this.numInteractions++;
            }
        }
        this.render();

        window.dataHandler.updatePresentClasses();

        this.mouseDown = false;
        this.mouseDrag = false;
    }

    _canvas_mouseleave(event) {
        if (window.uiBlocked) return;
        this.hoverTextElement.setProperty('text', null);
        this.render();
    }
}


class BoundingBoxAnnotationEntry extends AbstractDataEntry {
    /*
        Implementation for bounding box annotations.
        */
    constructor(entryID, properties, disableInteractions) {
        super(entryID, properties, disableInteractions);
        this._setup_markup();
    }

    getAnnotationType() {
        return 'boundingBox';
    }

    setLabel(label) {
        for (var key in this.annotations) {
            if (label === null || label === undefined) {
                this._removeElement(this.annotations[key]);
            } else {
                this.annotations[key].setProperty('label', label);
            }
        }
        this.numInteractions++;
        this.render();
        window.dataHandler.updatePresentClasses();
    }

    _setup_markup() {
        var self = this;
        super._setup_markup();
        this.canvas.css('cursor', window.uiControlHandler.getDefaultCursor());

        var htStyle = {
            fillColor: window.styles.hoverText.box.fill,
            textColor: window.styles.hoverText.text.color,
            strokeColor: window.styles.hoverText.box.stroke.color,
            lineWidth: window.styles.hoverText.box.stroke.lineWidth,
            lineDash: []
        };
        this.hoverTextElement = new HoverTextElement(this.entryID + '_hoverText', null, [0, 0.99], 'canvas',
            htStyle,
            5);
        this.viewport.addRenderElement(this.hoverTextElement);

        // interaction handlers
        if (!this.disableInteractions) {
            this.viewport.addCallback(this.entryID, 'mousedown', function (event) {
                self._canvas_mousedown(event);
            });
            this.viewport.addCallback(this.entryID, 'mousemove', function (event) {
                self._canvas_mousemove(event);
            });
            this.viewport.addCallback(this.entryID, 'mouseup', function (event) {
                self._canvas_mouseup(event);
            });
            this.viewport.addCallback(this.entryID, 'mouseleave', function (event) {
                self._canvas_mouseleave(event);
            });
        }
    }

    _toggleActive(event) {
        /*
            Sets boxes active or inactive as follows:
            - if a box encompasses the event's coordinates:
                - and is not active: it is turned active
                - and is active: nothing happens
                Any other box that is active _and_ contains the point stays active.
                Other boxes that are active and do not contain the point get deactivated,
                unless the shift key is held down.
            - if no box contains the coordinates, every single one is deactivated.
        */
        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
        var minDist = 1e9;
        var argMin = null;
        for (var key in this.annotations) {
            var bbox = this.annotations[key].getRenderElement();
            if (bbox.containsPoint(coords)) {
                var dist = bbox.euclideanDistance(coords);
                if (dist < minDist) {
                    minDist = dist;
                    argMin = key;
                }
                if (!(event.shiftKey && this.annotations[key].isActive())) {
                    // deactivate
                    if (this.annotations[key].isVisible()) {
                        this.annotations[key].setActive(false, this.viewport);
                    }
                }
            } else if (!event.shiftKey) {
                // bbox outside and no shift key; deactivate
                if (this.annotations[key].isVisible()) {
                    this.annotations[key].setActive(false, this.viewport);
                }
            }
        }

        // handle closest
        if (argMin === null) {
            // deactivate all
            for (var key in this.annotations) {
                if (this.annotations[key].isVisible()) {
                    this.annotations[key].setActive(false, this.viewport);
                }
            }
        } else if (this.annotations[argMin].isVisible()) {
            // set closest one active
            this.annotations[argMin].setActive(true, this.viewport);
        }
    }

    _canvas_mouseout(event) {
        // clear hover text
        if (window.uiBlocked) return;
        this.hoverTextElement.setProperty('text', null);
        this.render();
    }

    _createAnnotation(event) {
        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
        var props = {
            'x': coords[0],
            'y': coords[1],
            'width': 0,
            'height': 0,
            'label': window.labelClassHandler.getActiveClassID()
        };
        var anno = new Annotation(window.getRandomID(), props, 'boundingBoxes', 'annotation');
        this._addElement(anno);
        anno.getRenderElement().registerAsCallback(this.viewport);
        anno.getRenderElement().setActive(true, this.viewport);
        // manually fire mousedown event on annotation
        anno.getRenderElement()._mousedown_event(event, this.viewport);
    }

    _deleteActiveAnnotations(event) {
        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
        var minDist = 1e9;
        var argMin = null;
        for (var key in this.annotations) {
            var bbox = this.annotations[key].getRenderElement();
            if (bbox.containsPoint(coords)) {
                if (this.annotations[key].isActive()) {
                    this.annotations[key].getRenderElement().deregisterAsCallback(this.viewport);
                    this._removeElement(this.annotations[key]);
                    return;
                }
                var dist = bbox.euclideanDistance(coords);
                if (dist < minDist) {
                    minDist = dist;
                    argMin = key;
                }
            }
        }

        if (argMin != null) {
            // no active annotation found, but clicked within another one; delete it
            this._removeElement(this.annotations[argMin]);
        }
        window.dataHandler.updatePresentClasses();
    }

    _drawCrosshairLines(coords, visible) {
        if (window.uiBlocked) return;
        if ((this.crosshairLines === null || this.crosshairLines === undefined) && visible) {
            // create
            var vertLine = new LineElement(this.entryID + '_crosshairX', coords[0], 0, coords[0], window.defaultImage_h,
                window.styles.crosshairLines,
                false,
                1);
            var horzLine = new LineElement(this.entryID + '_crosshairY', 0, coords[1], window.defaultImage_w, coords[1],
                window.styles.crosshairLines,
                false,
                1);
            this.crosshairLines = new ElementGroup(this.entryID + '_crosshairLines', [vertLine, horzLine], 1);
            this.viewport.addRenderElement(this.crosshairLines);
            this.canvas.css('cursor', 'crosshair');

        } else if (this.crosshairLines !== null && this.crosshairLines !== undefined) {
            if (visible) {
                // update
                this.crosshairLines.elements[0].setProperty('startX', coords[0]);
                this.crosshairLines.elements[0].setProperty('endX', coords[0]);
                this.crosshairLines.elements[1].setProperty('startY', coords[1]);
                this.crosshairLines.elements[1].setProperty('endY', coords[1]);
                this.canvas.css('cursor', 'crosshair');
            } else {
                // remove
                this.viewport.removeRenderElement(this.crosshairLines);
                this.crosshairLines = null;
                this.canvas.css('cursor', window.uiControlHandler.getDefaultCursor());
            }
        }
    }

    _canvas_mousedown(event) {
        if (window.uiBlocked) return;
        this.mouseDown = true;

        // check functionality
        if (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION) {
            // set all currently active boxes inactive
            for (var key in this.annotations) {
                if (this.annotations[key].isVisible()) {
                    this.annotations[key].setActive(false, this.viewport);
                }
            }

            // start creating a new bounding box
            this._createAnnotation(event);
        }
        this.render();
    }

    _canvas_mousemove(event) {
        if (window.uiBlocked) return;
        if (this.mouseDown) this.mouseDrag = true;

        var coords = this.viewport.getRelativeCoordinates(event, 'validArea');

        // update crosshair lines
        this._drawCrosshairLines(coords, window.uiControlHandler.getAction() == ACTIONS.ADD_ANNOTATION);

        // update hover text
        var hoverText = null;
        switch (window.uiControlHandler.getAction()) {
            case ACTIONS.ADD_ANNOTATION:
                hoverText = 'add new \"' + window.labelClassHandler.getActiveClassName() + '"';
                this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                break;
            case ACTIONS.REMOVE_ANNOTATIONS:
                var numActive = 0;
                for (var key in this.annotations) {
                    if (this.annotations[key].isActive()) numActive++;
                }
                if (numActive > 0) {
                    hoverText = 'Remove ' + numActive + ' annotation';
                    if (numActive > 1) hoverText += 's';
                    this.hoverTextElement.setProperty('fillColor', window.styles.hoverText.box.fill);
                }
                break;
            case ACTIONS.DO_NOTHING:
                // find box over coordinates
                var anno = null;
                for (var key in this.annotations) {
                    if (this.annotations[key].geometry.isInDistance(coords, window.annotationProximityTolerance / Math.min(this.viewport.canvas.width(), this.viewport.canvas.height()))) {
                        anno = this.annotations[key];
                        break;
                    }
                }
                // set text
                if (anno === undefined || anno === null) {
                    hoverText = null;
                    break;
                }
                if (!this.mouseDrag && anno.isActive() && anno.label != window.labelClassHandler.getActiveClassID()) {
                    hoverText = 'move or change label to "' + window.labelClassHandler.getActiveClassName() + '"';
                    this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getActiveColor());
                } else {
                    // show current class name of box
                    hoverText = window.labelClassHandler.getName(anno.label);
                    this.hoverTextElement.setProperty('fillColor', window.labelClassHandler.getColor(anno.label));
                }
                break;
        }
        // this.hoverTextElement.setProperty('position', coords);

        // flip text color if needed
        var htFill = this.hoverTextElement.getProperty('fillColor');
        if (htFill != null && window.getBrightness(htFill) >= 92) {
            this.hoverTextElement.setProperty('textColor', '#000000');
        } else {
            this.hoverTextElement.setProperty('textColor', '#FFFFFF');
        }

        this.hoverTextElement.setProperty('text', hoverText);

        this.render();
    }

    _canvas_mouseup(event) {
        if (window.uiBlocked) return;

        // check functionality
        if (window.uiControlHandler.getAction() === ACTIONS.ADD_ANNOTATION) {
            // new annotation completed
            //TODO: may fire before other rectangle's events, making them unwantedly active while finishing new rect
            // window.uiControlHandler.getAction() = ACTIONS.DO_NOTHING;
            this.numInteractions++;

        } else if (window.uiControlHandler.getAction() === ACTIONS.REMOVE_ANNOTATIONS) {
            this._deleteActiveAnnotations(event);
            // window.uiControlHandler.getAction() = ACTIONS.DO_NOTHING;
            this.numInteractions++;

        } else if (window.uiControlHandler.getAction() === ACTIONS.DO_NOTHING) {
            // update annotations to current label (if active and no dragging [resizing] was going on)
            if (!this.mouseDrag) {
                var coords = this.viewport.getRelativeCoordinates(event, 'validArea');
                for (var key in this.annotations) {
                    if (this.annotations[key].isActive()) {
                        if (event.shiftKey || this.annotations[key].getRenderElement().containsPoint(coords)) {
                            this.annotations[key].setProperty('label', window.labelClassHandler.getActiveClassID());
                        }
                    }
                }

                // activate or deactivate
                this._toggleActive(event);
                this.numInteractions++;
            }
        }

        this.render();

        window.dataHandler.updatePresentClasses();

        this.mouseDrag = false;
        this.mouseDown = false;
    }

    _canvas_mouseleave(event) {
        if (window.uiBlocked) return;
        this.hoverTextElement.setProperty('text', null);
        this._drawCrosshairLines(null, false);
        this.render();
    }
}


class SemanticSegmentationEntry extends AbstractDataEntry {
    /*
        Implementation for segmentation maps.
    */
    constructor(entryID, properties, disableInteractions) {
        super(entryID, properties, disableInteractions);

        this.loadingPromise.then(response => {
            if (response) {
                // store natural image dimensions for annotations
                properties['width'] = this.imageEntry.image.naturalWidth;
                properties['height'] = this.imageEntry.image.naturalHeight;
                this._init_data(properties);
            }
        });

        this._setup_markup();
    }

    getAnnotationType() {
        return 'segmentationMap';
    }

    setAnnotationsVisible(visible) {
        super.setAnnotationsVisible(visible);
        this.annotation.setVisible(visible);
    }

    removeAllAnnotations() {
        if (typeof (this.segMap) === 'object') {
            this.segMap.clearAll();
            this.render();

            window.dataHandler.updatePresentClasses();
        }
    }

    setLabel(label) {
        return;
    }

    _addElement(element) {
        if (typeof (this.annotations) !== 'object') {
            // not yet initialized; abort
            return;
        }

        // allow only one annotation for segmentation entry
        var key = element['annotationID'];
        if (element['type'] === 'annotation') {
            if (typeof (this.annotations) === 'object' && Object.keys(this.annotations).length > 0) {
                // replace current annotation
                var currentKey = Object.keys(this.annotations)[0];
                this.viewport.removeRenderElement(this.annotations[currentKey]);
                delete this.annotations[currentKey];
            }

            // add new item
            this.annotations[key] = element;
            this.viewport.addRenderElement(element.getRenderElement());
        }
        // else if(element['type'] ==='prediction' && window.showPredictions) {
        //     this.predictions[key] = element;
        //     this.viewport.addRenderElement(element.getRenderElement());
        // }

        window.dataHandler.updatePresentClasses();
    }

    _init_data(properties) {
        // create new blended segmentation map from annotation and prediction
        try {
            var annoKeys = Object.keys(properties['annotations']);
        } catch {
            annoKeys = {};
        }
        try {
            var predKeys = Object.keys(properties['predictions']);
        } catch {
            var predKeys = {};
        }
        var entryProps = {};
        if (annoKeys.length > 0) {
            entryProps = properties['annotations'][annoKeys[0]];
            if (predKeys.length > 0) {
                entryProps['segmentationmask_predicted'] = properties['predictions'][predKeys[0]]['segmentationmask'];
            }
        } else if (predKeys.length > 0) {
            entryProps = properties['predictions'][predKeys[0]];
            entryProps['segmentationmask_predicted'] = entryProps['segmentationmask'];
            delete entryProps['segmentationmask'];
        }
        if (properties.hasOwnProperty('width')) {
            entryProps['width'] = properties['width'];
        }
        if (properties.hasOwnProperty('height')) {
            entryProps['height'] = properties['height'];
        }
        this.annotation = new Annotation(window.getRandomID(), entryProps, 'segmentationMasks', 'annotation');
        this._addElement(this.annotation);
        this.segMap = this.annotation.geometry;
        this.size = this.segMap.getSize();
    }

    _parseLabels(properties) {
        this.predictions = {};
        this.annotations = {};
    }

    _setup_markup() {
        var self = this;
        super._setup_markup();
        this.canvas.css('cursor', window.uiControlHandler.getDefaultCursor());

        // brush symbol
        this.brush = new PaintbrushElement(this.id + '_brush', null, null, 5);
        this.viewport.addRenderElement(this.brush);

        // interaction handlers
        if (!this.disableInteractions) {
            this.viewport.addCallback(this.entryID, 'mousedown', function (event) {
                self._canvas_mousedown(event);
            });
            this.viewport.addCallback(this.entryID, 'mousemove', function (event) {
                self._canvas_mousemove(event);
            });
            this.viewport.addCallback(this.entryID, 'mouseup', function (event) {
                self._canvas_mouseup(event);
            });
            this.viewport.addCallback(this.entryID, 'mouseleave', function (event) {
                self._canvas_mouseleave(event);
            });
        }
    }

    _set_default_brush() {
        this.viewport.removeRenderElement(this.brush);
        this.brush = this.brushes[window.uiControlHandler.getBrushType()];
        this.viewport.addRenderElement(this.brush);
    }


    __paint(event) {
        if (this.imageEntry !== null && [ACTIONS.ADD_ANNOTATION, ACTIONS.REMOVE_ANNOTATIONS].includes(window.uiControlHandler.getAction())) {

            // update mouse position
            this.mousePos = this.viewport.getRelativeCoordinates(event, 'validArea');
            var mousePos_abs = [
                this.mousePos[0] * this.size[0],
                this.mousePos[1] * this.size[1]
            ];

            // show brush
            this.brush.setProperty('x', this.mousePos[0]);
            this.brush.setProperty('y', this.mousePos[1]);

            // paint with brush at current position
            if (this.mouseDown) {
                var scaleFactor = Math.min(
                    (this.segMap.canvas.width / this.canvas.width()),
                    (this.segMap.canvas.height / this.canvas.height())
                );
                var brushSize = [
                    window.uiControlHandler.segmentation_properties.brushSize * scaleFactor,
                    window.uiControlHandler.segmentation_properties.brushSize * scaleFactor
                ];
                if (window.uiControlHandler.getAction() === ACTIONS.REMOVE_ANNOTATIONS || event.altKey) {
                    this.segMap.clear(mousePos_abs,
                        window.uiControlHandler.segmentation_properties.brushType,
                        brushSize);
                } else {
                    this.segMap.paint(mousePos_abs,
                        window.activeClassColor,
                        window.uiControlHandler.segmentation_properties.brushType,
                        brushSize);
                }
            }

        } else {
            // hide brush
            this.brush.setProperty('x', null);
        }
        this.render();
    }


    // callbacks
    _canvas_mousedown(event) {
        if (window.uiBlocked) return;
        this.mouseDown = true;
        this.__paint(event);
    }

    _canvas_mousemove(event) {
        if (window.uiBlocked) return;
        this.__paint(event);
    }

    _canvas_mouseup(event) {
        this.mouseDown = false;
        this.numInteractions++;
    }

    _canvas_mouseleave(event) {
        this.mouseDown = false;
    }
}