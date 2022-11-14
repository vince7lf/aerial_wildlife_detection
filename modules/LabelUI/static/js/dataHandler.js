/*
    Maintains the data entries currently on display.

    2019-21 Benjamin Kellenberger
*/

class DataHandler {

    constructor(parentDiv) {
        this.parentDiv = parentDiv;
        this.dataEntries = [];
        this.numImagesPerBatch = window.numImagesPerBatch;

        this.undoStack = [];
        this.redoStack = [];

        this.tiles = {}
        this.entriesStack = {};

        this.skipConfirmationDialog = window.getCookie('skipAnnotationConfirmation');

        // prepare user statistics (e.g. browser)
        this._navigator = {};
        for (var i in navigator) this._navigator[i] = navigator[i];
        // this._navigator = JSON.stringify(this._navigator);

        // check if user has finished labeling
        if (window.annotationType === 'segmentationMasks') {
            // re-check if finished after every batch in this case
            this.recheckInterval = 1;
        } else {
            this.recheckInterval = Math.max(8, 64 / window.numImagesPerBatch);
        }
        this.numBatchesSeen = 0;
        this._check_user_finished();
    }

    _check_user_finished() {
        let footerPanel = $('#footer-message-panel');
        if (footerPanel.length === 0) return;
        var self = this;
        $.ajax({
            url: 'getUserFinished',
            method: 'GET',
            success: function (response) {
                if (response.hasOwnProperty('finished') && response['finished']) {
                    // show message
                    footerPanel.html('Congratulations, you have finished labeling this dataset!')
                    footerPanel.css('color', 'green');
                    footerPanel.show();

                    // disable querying
                    self.numBatchesSeen = -1;
                } else {
                    // reset counter for querying
                    self.numBatchesSeen = 0;
                }
            }
        })
    }


    clearSelection() {

        window.activeEntryID = null;

        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].clearSelection();
        }
        // clear tile group
        window.labelClassHandler.updateTileGroup(null);
        window.labelClassHandler.updateImageGroup(null);


    }

    setSelectedFeatures(features) {
        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].setSelectedFeatures(features);
        }
    }

    renderAll() {
        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].render();
        }
    }


    resetZoom() {
        for (var e = 0; e < this.dataEntries.length; e++) {
            this.dataEntries[e].viewport.resetViewport();
        }
    }


    assignLabelToAll() {
        /*
            For classification entries only: assigns the selected label
            to all data entries.
        */
        if (window.uiBlocked) return;
        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].setLabel(window.labelClassHandler.getActiveClassID());
        }
    }

    clearLabelInAll() {
        /*
            Remove all assigned labels (if 'enableEmptyClass' is true).
        */
        if (window.uiBlocked || !window.enableEmptyClass) return 0;
        var numRemoved = 0;
        for (var i = 0; i < this.dataEntries.length; i++) {
            numRemoved += this.dataEntries[i].removeAllAnnotations();
        }
        return numRemoved;
    }

    refreshActiveAnnotations() {
        /*
            Iterates through the data entries and sets all active annotations
            inactive, unless the globally set active data entry corresponds to
            the respective data entry's entryID.
        */
        for (var i = 0; i < this.dataEntries.length; i++) {
            if (this.dataEntries[i].entryID != window.activeEntryID) {
                this.dataEntries[i].setAnnotationsInactive();
            }
        }
    }

    updateActiveAnnotations(labelsObj, overwrite) {
        /*
            Iterates through the data entries and sets all active annotations
            inactive, unless the globally set active data entry corresponds to
            the respective data entry's entryID.
        */
        for (var i = 0; i < this.dataEntries.length; i++) {
            if (this.dataEntries[i].entryID == window.activeEntryID) {
                this.dataEntries[i].updateAnnotations(labelsObj, overwrite);
            }
        }
    }


    removeActiveAnnotations() {
        if (window.uiBlocked) return 0;
        var numRemoved = 0;
        if (window.annotationType === 'labels') {
            return this.clearLabelInAll();
        } else {
            for (var i = 0; i < this.dataEntries.length; i++) {
                numRemoved += this.dataEntries[i].removeActiveAnnotations();
            }
        }
        return numRemoved;
    }

    toggleActiveAnnotationsUnsure() {
        if (window.uiBlocked) return;
        window.unsureButtonActive = true;   // for classification entries
        var annotationsActive = false;
        for (var i = 0; i < this.dataEntries.length; i++) {
            var response = this.dataEntries[i].toggleActiveAnnotationsUnsure();
            if (response) annotationsActive = true;
        }

        if (annotationsActive) window.unsureButtonActive = false;
    }

    convertPredictions() {
        if (window.uiBlocked) return;
        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].convertPredictions();
        }
    }

    setPredictionsVisible(visible) {
        if (window.uiBlocked) return;
        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].setPredictionsVisible(visible);
        }
    }

    setAnnotationsVisible(visible) {
        if (window.uiBlocked) return;
        for (var i = 0; i < this.dataEntries.length; i++) {
            this.dataEntries[i].setAnnotationsVisible(visible);
        }
    }

    setMinimapVisible(visible) {
        if (window.uiBlocked) return;
        for (var i = 0; i < this.dataEntries.length; i++) {
            // this.dataEntries[i].setMinimapVisible(visible);
        }
    }

    getAllPresentClassIDs() {
        /*
            Returns a dict of all label class IDs that are present
            in the image entry/entries.
        */
        var presentClassIDs = {};
        for (var key in this.dataEntries) {
            presentClassIDs = {...presentClassIDs, ...this.dataEntries[key].getActiveClassIDs()};
        }
        return presentClassIDs;
    }


    updatePresentClasses() {
        //TODO: too much of a mess right now
        // /*
        //     Examines the label classes present in the images and
        //     puts their markup to the top of the class entries.
        // */
        // var presentClassIDs = this.getAllPresentClassIDs();

        // //TODO: this is very expensive; replace with LUT on the long term... Look Up Tables
        // var container = $('#legend-entries-active-container');
        // container.empty();
        // for(var key in presentClassIDs) {
        //     container.append(window.labelClassHandler.getClass(key).getMarkup(true));
        // }
    }

    _loadFirstBatch() {
        /**
         * Checks if an image UUID or a list thereof is provided in the URL
         * and loads those image(s) in that case.
         * Else proceeds loading regular batches.
         */
        let url = new URL(window.location.href);
        let uuids_load = url.searchParams.get('imgs');
        if (typeof (uuids_load) === 'string') {
            uuids_load = uuids_load.split(',');

            // make sure image UUIDs are unique
            let uuids_filtered = [];
            let uuids_added = {};
            for (var u = 0; u < uuids_load.length; u++) {
                if (!uuids_added.hasOwnProperty(uuids_load[u])) {
                    uuids_filtered.push(uuids_load[u]);
                    uuids_added[uuids_load[u]] = 1;
                }
            }
            return this._loadFixedBatch(uuids_filtered);
        } else {
            return this._loadNextBatch();
        }
    }

    _loadNextBatch() {
        var self = this;

        var url = 'getLatestImages?order=unlabeled&subset=default&limit=' + this.numImagesPerBatch;
        return $.ajax({
            url: url,
            dataType: 'json',
            success: function (data) {
                // clear current entries
                self.parentDiv.empty();
                self.dataEntries = [];

                let imgIDs = '';

                for (var d in data['entries']) {
                    // create new data entry
                    switch (String(window.annotationType)) {
                        case 'labels':
                            // test if image is a tile, checking for any geojson file <imagename>.geojson in the same folder as the images
                            // If so, create an image separated in tiles that will be displayed. But labels will be associated to each tile
                            var dataEntry = data['entries'][d]
                            if (dataEntry.fileName.indexOf('_tile.') > -1) {
                                var entry = new ClassificationTileEntry(d, dataEntry);
                                self.tiles[dataEntry.fileName] = entry;
                            } else {
                                var entry = new ClassificationMLEntry(d, dataEntry);
                            }
                            break;
                        case 'points':
                            var entry = new PointAnnotationEntry(d, data['entries'][d]);
                            break;
                        case 'boundingBoxes':
                            var entry = new BoundingBoxAnnotationEntry(d, data['entries'][d]);
                            break;
                        case 'segmentationMasks':
                            var entry = new SemanticSegmentationEntry(d, data['entries'][d]);
                            break;
                        default:
                            break;
                    }

                    // append
                    self.parentDiv.append(entry.markup);
                    self.dataEntries.push(entry);
                    self.entriesStack[d] = entry;

                    imgIDs += d + ','
                }

                // update present classes list
                self.updatePresentClasses();

                // show (or hide) predictions depending on threshold
                self.setPredictionsVisible(window.showPredictions_minConf); //TODO: more elegant solution that doesn't require window?
                self.convertPredictions();

                // adjust width of entries
                window.windowResized();

                // re-check if finished (if threshold exceeded)
                if (self.numBatchesSeen >= 0) {
                    self.numBatchesSeen += 1;
                    if (self.numBatchesSeen >= self.recheckInterval) {
                        // re-check
                        self._check_user_finished();
                    }
                }

                // modify URL
                if (imgIDs.length > 0) {
                    imgIDs = imgIDs.slice(0, imgIDs.length - 1);  // remove trailing comma
                    window.history.replaceState({}, document.title, 'interface?imgs=' + imgIDs);
                } else {
                    window.history.replaceState({}, document.title, 'interface');
                }
            },
            error: function (xhr, status, error) {
                if (error == 'Unauthorized') {
                    // ask user to provide password again
                    window.verifyLogin((self._loadNextBatch).bind(self));
                }
            }
        });
    }


    _loadReviewBatch() {
        var self = this;

        // get properties
        var minTimestamp = parseFloat($('#review-timerange').val());  ///1000;
        var skipEmptyImgs = $('#review-skip-empty').prop('checked');
        var goldenQuestionsOnly = $('#review-golden-questions-only').prop('checked');
        var userNames = [];
        if (window.uiControlHandler.hasOwnProperty('reviewUsersTable')) {
            // user is admin; check which names are selected
            window.uiControlHandler.reviewUsersTable.children().each(function () {
                var checked = $(this).find(':checkbox').prop('checked');
                if (checked) {
                    userNames.push($(this).find('.user-list-name').html());
                }
            })
        }

        var url = 'getImages_timestamp';
        return $.ajax({
            url: url,
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({
                minTimestamp: minTimestamp,
                users: userNames,
                skipEmpty: skipEmptyImgs,
                goldenQuestionsOnly: goldenQuestionsOnly,
                limit: this.numImagesPerBatch
            }),
            success: function (data) {
                // clear current entries
                self.parentDiv.empty();
                self.dataEntries = [];

                let imgIDs = '';

                for (var d in data['entries']) {
                    // create new data entry
                    switch (String(window.annotationType)) {
                        case 'labels':
                            // test if image is a tile, checking for any geojson file <imagename>.geojson in the same folder as the images
                            // If so, create an image separated in tiles that will be displayed. But labels will be associated to each tile
                            var dataEntry = data['entries'][d]
                            if (dataEntry.fileName.indexOf('_tile.') > -1) {
                                var entry = new ClassificationTileEntry(d, dataEntry);
                                self.tiles[dataEntry.fileName] = entry;
                            } else {
                                var entry = new ClassificationMLEntry(d, dataEntry);
                            }
                            break;
                        case 'points':
                            var entry = new PointAnnotationEntry(d, data['entries'][d]);
                            break;
                        case 'boundingBoxes':
                            var entry = new BoundingBoxAnnotationEntry(d, data['entries'][d]);
                            break;
                        case 'segmentationMasks':
                            var entry = new SemanticSegmentationEntry(d, data['entries'][d]);
                            break;
                        default:
                            break;
                    }

                    // append
                    self.parentDiv.append(entry.markup);
                    self.dataEntries.push(entry);
                    self.entriesStack[d] = entry;

                    // update min and max timestamp
                    var nextTimestamp = data['entries'][d]['last_checked'];
                    minTimestamp = Math.max(minTimestamp, nextTimestamp + 1);

                    imgIDs += d + ',';
                }

                // update present classes list
                self.updatePresentClasses();

                // show (or hide) predictions depending on threshold
                self.setPredictionsVisible(window.showPredictions_minConf); //TODO: more elegant solution that doesn't require window?
                self.convertPredictions();

                // update slider and date text
                $('#review-timerange').val(Math.min($('#review-timerange').prop('max'), minTimestamp));
                $('#review-time-text').html(new Date(minTimestamp * 1000).toLocaleString());

                // adjust width of entries
                window.windowResized();

                // modify URL
                if (imgIDs.length > 0) {
                    imgIDs = imgIDs.slice(0, imgIDs.length - 1);  // remove trailing comma
                    window.history.replaceState({}, document.title, 'interface?imgs=' + imgIDs);
                } else {
                    window.history.replaceState({}, document.title, 'interface');
                }
            },
            error: function (xhr, status, error) {
                if (error == 'Unauthorized') {
                    // ask user to provide password again
                    window.verifyLogin((self._loadReviewBatch).bind(self));
                }
            }
        });
    }


    _entriesToJSON(minimal, onlyUserAnnotations) {
        // assemble entries
        var entries = {};
        for (var e = 0; e < this.dataEntries.length; e++) {
            entries[this.dataEntries[e].entryID] = this.dataEntries[e].getProperties(minimal, onlyUserAnnotations);
        }

        // also append client statistics
        var meta = {
            browser: this._navigator,
            windowSize: [$(window).width(), $(window).height()],
            uiControls: {
                burstModeEnabled: window.uiControlHandler.burstMode
            }
        };

        return JSON.stringify({
            'entries': entries,
            'meta': meta
        })
    }

    _exportShareAnnotations() {

        var self = this;
        return $.ajax({
            url: 'requestDownloadAnnotations',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: {"dataType": "annotation", "extra_fields": {"meta": false}},
            dataType: 'json',
            success: function (response) {
                // check status
                if (response['response'] !== 0) {
                    // error
                    //TODO: make proper messaging system
                    alert('Error: ' + response);
                    return $.Deferred();
                } else {
                    // submitted generation of the annotation file
                    // the annotation file is now available under http://localhost:7780/test-mapserver6/files/test-mapserver6.txt or on the server under /app/images/test-mapserver6
                }
            },
            error: function (xhr, status, error) {
                if (error == 'Unauthorized') {
                    return window.verifyLogin((self._submitAnnotations).bind(self));

                } else {
                    // error
                    if (!silent) {
                        //TODO: make proper messaging system
                        alert('Unexpected error: ' + error);
                        return $.Deferred();
                    }
                }
            }
        });
    }

    _submitAnnotations(silent) {
        if (window.demoMode) {
            return $.Deferred().promise();
        }

        var self = this;
        var entries = this._entriesToJSON(true, false);
        return $.ajax({
            url: 'submitAnnotations',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: entries,
            dataType: 'json',
            success: function (response) {
                // check status
                if (response['status'] !== 0) {
                    // error
                    if (!silent) {
                        //TODO: make proper messaging system
                        alert('Error: ' + response['message']);
                        return $.Deferred();
                    }
                } else {
                    // submitted; nudge annotation watchdog if possible
                    try {
                        if (window.wfMonitor instanceof WorkflowMonitor) {
                            window.wfMonitor.queryNow(true);
                        }
                    } catch {
                    }

                    // submit generation of the annotation file
                    self._exportShareAnnotations();

                }
            },
            error: function (xhr, status, error) {
                if (error == 'Unauthorized') {
                    return window.verifyLogin((self._submitAnnotations).bind(self));

                } else {
                    // error
                    if (!silent) {
                        //TODO: make proper messaging system
                        alert('Unexpected error: ' + error);
                        return $.Deferred();
                    }
                }
            }
        });
    }

    _loadFixedBatch(batch) {
        var self = this;

        // check if changed and then submit current annotations first
        return $.ajax({
            url: 'getImages',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({'imageIDs': batch}),
            type: 'POST',
            success: function (data) {

                let imgIDs = '';    // for updating URL in case of errors
                let errors = '';

                // clear current entries
                self.parentDiv.empty();
                self.dataEntries = [];

                // add new ones
                for (var d in batch) {
                    let entryID = batch[d];

                    if (!data['entries'].hasOwnProperty(entryID) || (data.hasOwnProperty('imgs_malformed') && data['imgs_malformed'].hasOwnProperty(entryID))) {
                        errors += entryID + ', ';
                        continue;
                    }

                    switch (String(window.annotationType)) {
                        case 'labels':
                            // test if image is a tile, checking for any geojson file <imagename>.geojson in the same folder as the images
                            // If so, create an image separated in tiles that will be displayed. But labels will be associated to each tile
                            var dataEntry = data['entries'][entryID]
                            if (dataEntry.fileName.indexOf('_tile.') > -1) {
                                var entry = new ClassificationTileEntry(entryID, dataEntry);
                                self.tiles[dataEntry.fileName] = entry;
                            } else {
                                var entry = new ClassificationMLEntry(entryID, dataEntry);
                            }
                            break;
                        case 'points':
                            var entry = new PointAnnotationEntry(entryID, data['entries'][entryID]);
                            break;
                        case 'boundingBoxes':
                            var entry = new BoundingBoxAnnotationEntry(entryID, data['entries'][entryID]);
                            break;
                        case 'segmentationMasks':
                            var entry = new SemanticSegmentationEntry(entryID, data['entries'][entryID]);
                            break;
                        default:
                            break;
                    }

                    // append
                    self.parentDiv.append(entry.markup);
                    self.dataEntries.push(entry);
                    self.entriesStack[entryID] = entry;

                    imgIDs += entryID + ',';
                }

                // update present classes list
                self.updatePresentClasses();

                // show (or hide) predictions depending on threshold
                self.setPredictionsVisible(window.showPredictions_minConf); //TODO: more elegant solution that doesn't require window?
                self.convertPredictions();

                // adjust width of entries
                window.windowResized();

                window.setUIblocked(false);

                // modify URL
                if (imgIDs.length > 0) {
                    imgIDs = imgIDs.slice(0, imgIDs.length - 1);  // remove trailing comma
                    window.history.replaceState({}, document.title, 'interface?imgs=' + imgIDs);
                } else {
                    window.history.replaceState({}, document.title, 'interface');
                }

                // show message in case of errors
                if (errors.length > 0) {
                    if (errors.endsWith(', ')) errors = errors.slice(0, errors.length - 2);
                    window.messager.addMessage('The following images could not be found or loaded:\n' + errors, 'error');
                }
            },
            error: function (xhr, status, error) {
                if (error == 'Unauthorized') {
                    var callback = function () {
                        self._loadFixedBatch(batch);
                    }
                    window.verifyLogin((callback).bind(self));
                }
            }
        });
    }

    saveBatch() {
        if (window.uiBlocked) return;

        var _save_batch = function () {
            this._submitAnnotations();
        }
        this._showConfirmationDialog((_save_batch).bind(this));
    }


    nextBatch() {
        if (window.uiBlocked) return;

        var self = this;

        if (window.demoMode) {
            var _next_batch = function () {
                // in demo mode we add the entire objects to the history
                for (var e = 0; e < self.dataEntries.length; e++) {
                    self.dataEntries[e].markup.detach();
                }
                self.undoStack.push(self.dataEntries.slice());
                if (self.redoStack.length > 0) {
                    // re-initialize stored data entries
                    var entries = self.redoStack.pop();
                    self.dataEntries = entries;
                    for (var e = 0; e < self.dataEntries.length; e++) {
                        self.parentDiv.append(self.dataEntries[e].markup);
                    }
                } else {
                    self._loadNextBatch();
                }
            }

        } else {
            var _next_batch = function () {
                // add current image IDs to history
                var historyEntry = [];
                for (var i = 0; i < this.dataEntries.length; i++) {
                    historyEntry.push(this.dataEntries[i]['entryID']);
                }
                this.undoStack.push(historyEntry);

                var callback = function () {
                    if (self.redoStack.length > 0) {
                        var nb = self.redoStack.pop();
                        self._loadFixedBatch(nb.slice());
                    } else {
                        //TODO: temporary mode to ensure compatibility with running instances
                        try {
                            if ($('#imorder-review').prop('checked')) {
                                self._loadReviewBatch();
                            } else {
                                self._loadNextBatch();
                            }
                        } catch {
                            self._loadNextBatch();
                        }
                    }
                };

                // check if annotation commitment is enabled
                var doSubmit = $('#imorder-auto').prop('checked') || $('#review-enable-editing').prop('checked');
                if (doSubmit) {
                    this._submitAnnotations().done(callback);
                } else {
                    // only go to next batch, don't submit annotations
                    callback();
                }
            }
        }
        this._showConfirmationDialog((_next_batch).bind(this));
    }


    previousBatch() {
        if (window.uiBlocked || this.undoStack.length === 0) return;

        var self = this;

        if (window.demoMode) {
            var _previous_batch = function () {
                for (var e = 0; e < self.dataEntries.length; e++) {
                    self.dataEntries[e].markup.detach();
                }
                self.redoStack.push(self.dataEntries.slice());

                // re-initialize stored data entries
                var entries = self.undoStack.pop();
                self.dataEntries = entries;
                for (var e = 0; e < self.dataEntries.length; e++) {
                    self.parentDiv.append(self.dataEntries[e].markup);
                }
            }
        } else {
            var _previous_batch = function () {
                // add current image IDs to history
                var historyEntry = [];
                for (var i = 0; i < this.dataEntries.length; i++) {
                    historyEntry.push(this.dataEntries[i]['entryID']);
                }
                this.redoStack.push(historyEntry);

                var pb = this.undoStack.pop();

                // check if annotation commitment is enabled
                var doSubmit = $('#imorder-auto').prop('checked') || $('#review-enable-editing').prop('checked');
                if (doSubmit) {
                    this._submitAnnotations().done(function () {
                        self._loadFixedBatch(pb.slice());
                    });
                } else {
                    // only go to next batch, don't submit annotations
                    self._loadFixedBatch(pb.slice());
                }
                // if(dontCommit) {
                //     self._loadFixedBatch(pb.slice());

                // } else {
                //     this._submitAnnotations().done(function() {
                //         self._loadFixedBatch(pb.slice());
                //     });
                // }
            };
        }
        this._showConfirmationDialog((_previous_batch).bind(this));
    }


    _showConfirmationDialog(callback_yes) {

        // go to callback directly if user requested not to show message anymore
        if (this.skipConfirmationDialog) {
            callback_yes();
            return;
        }

        // create markup
        if (this.confirmationDialog_markup === undefined) {
            this.confirmationDialog_markup = {};
            this.confirmationDialog_markup.cookieCheckbox = $('<input type="checkbox" style="margin-right:10px" />');
            var cookieLabel = $('<label style="margin-top:20px">Do not show this message again.</label>').prepend(this.confirmationDialog_markup.cookieCheckbox);
            this.confirmationDialog_markup.button_yes = $('<button class="btn btn-primary btn-sm" style="display:inline;float:right">Yes</button>');
            var button_no = $('<button class="btn btn-secondary btn-sm" style="display:inline">No</button>');
            button_no.click(function () {
                window.showOverlay(null);
            });
            var buttons = $('<div></div>').append(button_no).append(this.confirmationDialog_markup.button_yes);
            this.confirmationDialog_markup.markup = $('<div><h2>Confirm annotations</h2><div>Are you satisfied with your annotations?</div></div>').append(cookieLabel).append(buttons);
        }

        // wrap callbacks
        var self = this;
        var dispose = function () {
            // check if cookie is to be set
            var skipMsg = self.confirmationDialog_markup.cookieCheckbox.is(':checked');
            if (skipMsg) {
                window.setCookie('skipAnnotationConfirmation', true, 365);
                self.skipConfirmationDialog = true;
            }
            window.showOverlay(null);
        }
        var action_yes = function () {
            dispose();
            callback_yes();
        }
        this.confirmationDialog_markup.button_yes.click(action_yes);

        window.showOverlay(this.confirmationDialog_markup.markup, false, false);
    }

    updateActiveAnnotationLabel(labelid, flag) {
        // find the active annotation
        // trigger toggleUserLabel
        for (var id in this.entriesStack) {
            if (this.entriesStack[id].entryID != window.activeEntryID) continue;
            if (flag) this.entriesStack[id].setLabel(labelid);
            else this.entriesStack[id].unsetLabel(labelid);
            return;
        }
    }

    tileSelected(tilename) {
        var countLabels = {};
        var uniqLabels = new Set();

        var imageNameSelected = tilename.substring(0, tilename.indexOf('_tile'));

        for (var id in this.entriesStack) {
            let URLImageParts = this.entriesStack[id].fileName.split('\\').pop().split('/');
            let imageName = URLImageParts[1].substring(0, URLImageParts[1].indexOf('_tile'));

            if (imageNameSelected !== imageName) continue;

            if (this.entriesStack[id].fileName.indexOf(tilename) !== -1) {

                // multi-labelling mode
                if (window.labelClassHandler.activeLabellingMode == false) {

                    this.entriesStack[id].click();

                    // refresh the filter if active
                    let hasClass = $('#filter-selected-label').hasClass('active');
                    window.labelClassHandler.filterSelectedLabel(hasClass);

                    // update the tile group
                    window.labelClassHandler.updateTileGroup(new Set([...this.entriesStack[id].getLabel()].sort()))

                } else {
                    // mono-labelling mode
                    // associate the label with the tile
                    if (!(typeof window.activeEntryID === "string")) {
                        // no active tile
                        this.entriesStack[id].click();
                        // is this tile has the label already ?
                        let isActiveTileAssociatedWithActiveLabel = this.isActiveTileAssociatedWithActiveLabel(window.activeEntryID, window.labelClassHandler.getActiveClassID())
                        this.updateActiveAnnotationLabel(window.labelClassHandler.getActiveClassID(), !isActiveTileAssociatedWithActiveLabel);
                    } else if (window.activeEntryID === this.entriesStack[id].entryID) {
                        // same tile clicked again
                        // is this tile has the label already ?
                        let isActiveTileAssociatedWithActiveLabel = this.isActiveTileAssociatedWithActiveLabel(window.activeEntryID, window.labelClassHandler.getActiveClassID())
                        this.updateActiveAnnotationLabel(window.labelClassHandler.getActiveClassID(), !isActiveTileAssociatedWithActiveLabel);
                        this.entriesStack[id].click();
                    } else {
                        // another tile clicked
                        this.entriesStack[id].click();
                        // is this tile has the label already ?
                        let isActiveTileAssociatedWithActiveLabel = this.isActiveTileAssociatedWithActiveLabel(window.activeEntryID, window.labelClassHandler.getActiveClassID())
                        this.updateActiveAnnotationLabel(window.labelClassHandler.getActiveClassID(), !isActiveTileAssociatedWithActiveLabel);
                    }

                    // reset and refresh
                    // keep active class
                    var currentActiveClass = window.labelClassHandler.getActiveClass();

                    // unselect all labels
                    window.labelClassHandler.switchoffLabelClasses();

                    // unselect all tiles
                    window.dataHandler.clearSelection();

                    // set active class
                    window.labelClassHandler.setActiveClass(currentActiveClass);

                    // and set a red frame around all tiles with that label
                    var features = this.getTilesAssociatedWithLabel(window.labelClassHandler.getActiveClassID())
                    this.setSelectedFeatures(features);

                    // update the tile group
                    window.labelClassHandler.updateTileGroup(null)

                }
                // return;
            }
            // update the image group
            // also done if the image matches (code above)
            let labels = this.entriesStack[id].getLabel();
            if (labels !== null) {
                uniqLabels = new Set([...uniqLabels, ...labels].sort())
                labels.forEach(id => {
                    if (id in countLabels) countLabels[id]++;
                    else countLabels[id] = 1;
                });
            }
        }
        window.labelClassHandler.updateImageGroup(uniqLabels, countLabels);

    }

    tileLabels(tilename) {
        for (var id in this.entriesStack) {
            if (this.entriesStack[id].fileName.indexOf(tilename) !== -1) {
                var labels = this.entriesStack[id].getLabel();
                return labels;
            }
        }
    }

    getTilesAssociatedWithLabel(labelClassID) {
        var features = new Set();
        for (var id in this.entriesStack) {
            var labels = this.entriesStack[id].getLabel();
            if (!(labels instanceof Set)) continue;
            for (let label of labels) {
                if (label == labelClassID) {
                    features.add(this.entriesStack[id])
                }
            }
        }
        return features;
    }

    isActiveTileAssociatedWithActiveLabel(activeEntryID, activeClassID) {
        for (var id in this.entriesStack) {
            var labels = this.entriesStack[id].getLabel();
            if (!(labels instanceof Set)) continue;
            for (let label of labels) {
                if (label === activeClassID
                    && activeEntryID === this.entriesStack[id].entryID) {
                    return true;
                }
            }
        }
        return false;
    }

    _updateLabelClassFavorit(labelclassid, is_favorit) {
        var self = this;

        var url = 'updateLabelClassFavorit?labelclassid=' + labelclassid + '&is_favorit=' + is_favorit;
        return $.ajax({
            url: url,
            method: 'get',
            success: function (data) {
                if (data.hasOwnProperty('result')) {
                    let result = data['result']
                }
            },
            error: function (xhr, status, error) {
                if (error == 'Unauthorized') {
                    // ask user to provide password again
                    window.verifyLogin((self._updateLabelClassFavorit).bind(self));
                }
            }
        });
    }

}