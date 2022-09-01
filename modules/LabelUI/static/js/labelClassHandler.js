/*
    Helper classes responsible for displaying the available label classes on the screen.

    2019-20 Benjamin Kellenberger
*/
/*
    Helper classes responsible for displaying the available label classes on the screen.

    2019-20 Benjamin Kellenberger
*/

window.parseClassdefEntry = function (id, entry, parent) {
    if (entry.hasOwnProperty('entries') && entry['entries'] != undefined) {
        // label class group
        if (Object.keys(entry['entries']).length > 0) {
            return new LabelClassGroup(id, entry, parent);
        } else {
            // empty group
            return null;
        }
    } else {
        // label class
        return new LabelClass(id, entry, parent);
    }
}

window._rainbow = function (numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch (i % 6) {
        case 0:
            r = 1;
            g = f;
            b = 0;
            break;
        case 1:
            r = q;
            g = 1;
            b = 0;
            break;
        case 2:
            r = 0;
            g = 1;
            b = f;
            break;
        case 3:
            r = 0;
            g = q;
            b = 1;
            break;
        case 4:
            r = f;
            g = 0;
            b = 1;
            break;
        case 5:
            r = 1;
            g = 0;
            b = q;
            break;
    }
    var c = "#" + ("00" + (~~(r * 255)).toString(16)).slice(-2) + ("00" + (~~(g * 255)).toString(16)).slice(-2) + ("00" + (~~(b * 255)).toString(16)).slice(-2);
    return (c);
}

window.initClassColors = function (numColors) {
    window.defaultColors = [];
    for (var c = 0; c < numColors; c++) {
        window.defaultColors.push(window._rainbow(numColors, c));
    }
}

window.getDefaultColor = function (idx) {
    return window.defaultColors[idx % window.defaultColors.length];
}


class LabelClass {
    constructor(classID, properties, parent) {
        this.classID = classID;
        this.name = (properties['name'] === null || properties['name'] === undefined ? '[Label Class ' + this.classID + ']' : properties['name']);
        this.index = properties['index'];
        this.color = (properties['color'] === null || properties['color'] === undefined ? window.getDefaultColor(this.index) : properties['color']);
        this.colorValues = window.getColorValues(this.color);   // [R, G, B, A]

        this.keystroke = properties['keystroke'];
        this.favorit = properties['favorit'];

        // flip active foreground color if background is too bright
        this.darkForeground = (window.getBrightness(this.color) >= 92);
        this.parent = parent;

        // markups
        this.markup = null;
        this.markup_alt = null;
    }

    buildMarkup(classID, id, legendInactive, foregroundStyle, colorStyle, name, altStyle, is_favorit) {
        var htmlStr = '<tr></tr>';
        if ( is_favorit === true )
            htmlStr = '<tr id="alabelstar_' + classID + '_ctn_favorit" style="display:block"></tr>';

        if ( is_favorit === true )
            id = id + "_favorit";
        var htmlMarkup = '<td ><div class="label-class-legend ' + legendInactive + '" id="' + id + '" style="' + foregroundStyle + colorStyle + '"><span id="label-count"></span><span class="label-text">' + name + '</span></div></td>';
        if (altStyle) {
            id = 'labelLegend_alt_' + classID;
            htmlMarkup = '<td ><div class="label-class-legend ' + legendInactive + '" id="' + id + '" style="' + foregroundStyle + '"><div class="legend-color-dot" style="' + colorStyle + '"></div><span class="label-text">' + name + '</span></div></td>'
        }

        let favorit_class = "label-favorit-unselected";
        if( this.favorit === true )
            favorit_class = "label-favorit-selected";
        var htmlBtn = '<td><button type="button" id="alabelstar_' + classID + '" class="btn btn-sm btn-light ' + favorit_class + '" title="Favorit" style="height: 28px; width: 35px"></button></td>'
        if( this.favorit === true )
            htmlBtn = '<td><button type="button" id="alabelstar_' + classID + '_favorit" class="btn btn-sm btn-light ' + favorit_class + '" title="Favorit" style="height: 28px; width: 35px"></button></td>'

        return {htmlStr: htmlStr, htmlMarkup: htmlMarkup, htmlBtn: htmlBtn}

    }

    getMarkup(altStyle) {

        if (['90000009-9009-9009-9009-900000000009', '80000008-8008-8008-8008-800000000008', '70000007-7007-7007-7007-700000000007'].includes(this.classID)) {
            var groupProps = [['90000009-9009-9009-9009-900000000009', 'no_favorits', 'No favorits'], ['80000008-8008-8008-8008-800000000008', 'no_label_tile', 'No labels'], ['70000007-7007-7007-7007-700000000007', 'no_label_image', 'No labels'],];
            for (var i = 0; i < groupProps.length; i++) {
                if (this.classID === groupProps[i][0]) {
                    var htmlMarkup = '<tr><td id="' + groupProps[i][1] + '" style="display:block;">' + groupProps[i][2] + '</td><td></td></tr>';
                    var markup = $(htmlMarkup);

                    return markup;
                }
            }
        }
        if (altStyle) {
            if (this.markup_alt != undefined && this.markup_alt != null) return this.markup_alt;
        } else {
            if (this.markup != undefined && this.markup != null) return this.markup;
        }

        var self = this;
        var name = this.name;
        var hasKeystroke = false;
        if (this.keystroke != null && this.keystroke != undefined && Number.isInteger(this.keystroke) && this.keystroke > 0 && this.keystroke <= 9) {
            name = '(' + (this.keystroke) + ') ' + this.name;
            hasKeystroke = true;
        }

        var foregroundStyle = '';
        if (altStyle || this.darkForeground) {
            foregroundStyle = 'color:black;';
        }
        var legendInactive = 'legend-inactive';
        if (this.parent.getActiveClassID() === this.classID) legendInactive = '';

        var classID = this.classID;
        var id = 'labelLegend_' + this.classID;
        var colorStyle = 'background:' + this.color;

        // favorit
        // favorit button to select favorit label
        var onClickFavoritLabel = function (e) {
            let id = "alabelstar_" + classID;
            let hasClass = $("[id^='" + id + "']").hasClass('label-favorit-unselected');
            if (hasClass) {
                $("[id^='" + id + "']").removeClass('label-favorit-unselected')
                $("[id^='" + id + "']").addClass('label-favorit-selected')
                // add it to the Favorit group
                var clone = $('#' + id).parent().parent().clone(true);
                clone.attr("id", id + '_ctn_favorit');
                clone.attr("style", "display:block");
                // change the button id
                id = "alabelstar_" + classID;
                clone.find("[id='" + id + "']").attr("id", id + "_favorit");

                id = 'labelLegend_' + classID;
                if (altStyle) {
                    id = 'labelLegend_alt_' + classID;
                }
                var clonedLabel = clone.find("[id^='" + id + "']");
                clonedLabel.attr("id", id + '_favorit');
                var parent = $('#10000001-1001-1001-1001-100000000001').find('.labelGroup-children');
                clone.appendTo(parent);

                // persist
                window.dataHandler._updateLabelClassFavorit(classID, true);
            } else {
                $('#' + id + '_ctn_favorit').remove();
                $("[id^='" + id + "']").removeClass('label-favorit-selected')
                $("[id^='" + id + "']").addClass('label-favorit-unselected')

                // persist
                window.dataHandler._updateLabelClassFavorit(classID, false);
            }
            // add dummy message no favorits if no favorits
            // count favorits
            var nbFavorits = $("[id$='_favorit']").length;
            // if no favorits, set the message
            if (nbFavorits === 0) {
                $("#10000001-1001-1001-1001-100000000001").find("#no_favorits").attr("style", "display:block");
            } else {
                $("#10000001-1001-1001-1001-100000000001").find("#no_favorits").attr("style", "display:none");
            }
        }

        // label control for the favorit
        var htmlStr = '<tr></tr>';

        var htmlMarkup = '<td ><div class="label-class-legend ' + legendInactive + '" id="' + id + '" style="' + foregroundStyle + colorStyle + '"><span id="label-count"></span><span class="label-text">' + name + '</span></div></td>';
        if (altStyle) {
            id = 'labelLegend_alt_' + this.classID;
            htmlMarkup = '<td ><div class="label-class-legend ' + legendInactive + '" id="' + id + '" style="' + foregroundStyle + '"><div class="legend-color-dot" style="' + colorStyle + '"></div><span class="label-text">' + name + '</span></div></td>'
        }
        var markup = $(htmlMarkup);

        let favorit_class = "label-favorit-unselected";
        if( this.favorit === true )
            favorit_class = "label-favorit-selected";
        var htmlBtn = '<td><button type="button" id="alabelstar_' + this.classID + '" class="btn btn-sm btn-light ' + favorit_class + '" title="Favorit" style="height: 28px; width: 35px"></button></td>'
        var favoritLabelBtn = $(htmlBtn);
        favoritLabelBtn.click(onClickFavoritLabel);

        var labelControl = $(htmlStr);
        labelControl.append(markup);
        labelControl.append(favoritLabelBtn);

        // setup click handler to activate label class
        var onClickMarkupLabel = function(e) {
            if (window.uiBlocked) return;

            // is there any tile selected ?
            if (window.activeEntryID === null || window.activeEntryID === undefined) return; // no active tile do nothing and return

            if (window.labelClassHandler.activeLabellingMode == true) {
                // mono-labelling

                // unselect all labels
                window.labelClassHandler.switchoffLabelClasses();

                // unselect all tiles
                window.dataHandler.clearSelection();

                self.parent.setActiveClass(self);

                // and set a red frame around all tiles with that label
                var features = window.dataHandler.getTilesAssociatedWithLabel(self.classID)
                window.dataHandler.setSelectedFeatures(features);

            } else {
                // multi-labelling
                self.parent.setActiveClass(self);
            }
            // refresh the filter if active
            let hasClass = $('#filter-selected-label').hasClass('active');
            window.labelClassHandler.filterSelectedLabel(hasClass);
        }
        markup.click(onClickMarkupLabel);

        // listener for keypress if keystroke defined
        if (hasKeystroke) {
            $(window).keyup(function (event) {
                if (window.uiBlocked || window.shortcutsDisabled) return;
                try {
                    var key = parseInt(String.fromCharCode(event.which));
                    if (key == self.keystroke) {
                        self.parent.setActiveClass(self);

                        window.dataHandler.renderAll();
                    }
                } catch {
                    return;
                }
            });
        }

        // construct a clone for the favorit group
        if ( this.favorit === true ) {
            var markups = this.buildMarkup(this.classID, id, legendInactive, foregroundStyle, colorStyle, name, altStyle, this.favorit)
            var cloneLabelControl = $(markups.htmlStr);
            var favoritLabelBtn = $(markups.htmlBtn);
            favoritLabelBtn.click(onClickFavoritLabel);
            var markup = $(markups.htmlMarkup);
            markup.click(onClickMarkupLabel);
            cloneLabelControl.append(markup);
            cloneLabelControl.append(favoritLabelBtn);
            // add clone to the history group
            var parent = $('#10000001-1001-1001-1001-100000000001').find('.labelGroup-children');
            cloneLabelControl.appendTo(parent);

            // hide label 'no label'
            $('#10000001-1001-1001-1001-100000000001').find("#no_favorits").attr("style", "display:none");
        }

        // save for further use
        if (altStyle) this.markup_alt = labelControl; else this.markup = labelControl;

        return labelControl;
    }


    filter(keywords) {
        /*
            Shows (or hides) this entry if it matches (or does not match)
            one or more of the keywords specified according to the Leven-
            shtein distance.
        */
        if (keywords === null || keywords === undefined) {
            if (this.markup != null) {
                this.markup.show();
            }
            if (this.markup_alt != null) {
                this.markup_alt.show();
            }
            return {dist: 0, bestMatch: this};
        }
        var target = this.name.toLowerCase();
        var minLevDist = 1e9;
        for (var k = 0; k < keywords.length; k++) {
            var kw = keywords[k].toLowerCase();
            var levDist = window.levDist(target, kw);
            minLevDist = Math.min(minLevDist, levDist);
            if (target.includes(kw) || levDist <= 3) {
                if (this.markup != null) {
                    this.markup.show();
                }
                if (this.markup_alt != null) {
                    this.markup_alt.show();
                }
                if (target === kw) minLevDist = 0; else if (target.includes(kw)) minLevDist = 0.5;
                return {dist: minLevDist, bestMatch: this};
            }
        }

        // invisible
        if (this.markup != null) {
            this.markup.hide();
        }
        if (this.markup_alt != null) {
            this.markup_alt.hide();
        }
        return {dist: minLevDist, bestMatch: this};
    }

    filterSelectedLabel(active) {

        let labelSelected = false;
        if (!active) {
            if (this.markup != null) {
                this.markup.show();
            }
            if (this.markup_alt != null) {
                this.markup_alt.show();
            }
            return {match: this};
        }

        if (!$('#labelLegend_' + this.classID).hasClass('legend-inactive')) {
            labelSelected = true;
        }
        if (labelSelected === true) {
            if (this.markup != null) {
                this.markup.show();
            }
            if (this.markup_alt != null) {
                this.markup_alt.show();
            }
            return {match: this};
        }

        // invisible
        if (this.markup != null) {
            this.markup.hide();
        }
        if (this.markup_alt != null) {
            this.markup_alt.hide();
        }

        return {match: this};

    };

    copySelectedLabel() {
        if (!$('#labelLegend_' + this.classID).hasClass('legend-inactive')) {
            return this;
        }
        return null;
    };
}

class LabelClassGroup {
    constructor(id, properties, parent) {
        this.id = id;
        this.parent = parent;
        this.children = [];
        this.labelClasses = {};
        this.markup = null;
        this._parse_properties(properties);
    }

    _parse_properties(properties) {
        this.name = properties['name'];
        this.color = properties['color'];

        // append children in order
        for (var key in properties['entries']) {

            var nextItem = window.parseClassdefEntry(key, properties['entries'][key], this);
            if (nextItem === null) continue;

            this.children.push(nextItem);
            if (nextItem instanceof LabelClass) {
                this.labelClasses[key] = nextItem;
            } else {
                // append label class group's entries
                this.labelClasses = {...this.labelClasses, ...nextItem.labelClasses};
            }
        }
    }

    getMarkup() {
        if (this.markup != null) return this.markup;

        this.markup = $('<div class="labelGroup" id="' + this.id + '"></div>');
        var childrenDiv = $('<table class="labelGroup-children"></table>');

        // append all children
        for (var c = 0; c < this.children.length; c++) {
            childrenDiv.append($(this.children[c].getMarkup()));
        }

        // expand/collapse on header click
        if (this.name != null && this.name != undefined) {
            var markupHeader = $('<h3 class="expanded">' + this.name + '</h3>');
            markupHeader.click(function () {
                $(this).toggleClass('expanded');
                if (childrenDiv.is(':visible')) {
                    childrenDiv.slideUp();
                } else {
                    childrenDiv.slideDown();
                }
            });
            this.markup.append(markupHeader);
        }

        this.markup.append(childrenDiv);

        return this.markup;
    }

    getActiveClassID() {
        return this.parent.getActiveClassID();
    }

    setActiveClass(labelClassInstance) {
        this.parent.setActiveClass(labelClassInstance);
    }

    filter(keywords) {
        /*
            Delegates the command to the children and awaits their
            response. If none of the children are visible after
            filtering, the group itself is being hidden. Propagates
            the state of itself to the parent through the return
            statement.
        */
        var childVisible = false;
        var minLevDist = 1e9;
        var argMin = null;
        for (var c = 0; c < this.children.length; c++) {
            var result = this.children[c].filter(keywords);
            if (result != null && result.dist < minLevDist) {
                minLevDist = Math.min(result.dist, minLevDist);
                argMin = result.bestMatch;
                if (result.dist <= 3) {
                    childVisible = true;
                }
            }
        }

        // show or hide group depending on children's visibility
        if (childVisible) this.markup.show(); else this.markup.hide();
        return {dist: minLevDist, bestMatch: argMin};
    }

    filterSelectedLabel(active) {
        var childVisible = false;
        for (var c = 0; c < this.children.length; c++) {
            var result = this.children[c].filterSelectedLabel(active);
            if (result != null) {
                childVisible = true;
            }
        }

        // show or hide group depending on children's visibility
        if (childVisible) this.markup.show(); else this.markup.hide();
        return result;
    }

    copySelectedLabel() {
        let selectedLabels = [];
        for (let c = 0; c < this.children.length; c++) {
            let result = this.children[c].copySelectedLabel();
            if (result) selectedLabels.push(result)
        }

        return selectedLabels.length == 0 ? null : selectedLabels;
    }
}


class LabelClassHandler {
    constructor(classLegendDiv) {
        this.classLegendDiv = classLegendDiv;
        this.items = [];    // may be both labelclasses and groups
        this.selectedLabelClasses = [];    // may be both labelclasses and groups
        this.dummyClass = new LabelClass('00000000-0000-0000-0000-000000000000', {
            name: 'Label class', index: 1, color: '#17a2b8', keystroke: null
        });
        this.activeLabellingMode = false;
        this._setupLabelClasses();

        this.setActiveClass(this.labelClasses[Object.keys(this.labelClasses)[0]]);

    }

    _setupLabelClasses() {
        // parse label classes and class groups
        this.labelClasses = {};
        this.indexToLabelclassMapping = []; // LUT for indices to label classes
        this.labelToColorMapping = {};  // LUT for color hex strings to label classes

        // initialize default rainbow colors
        window.initClassColors(window.classes.numClasses + 1)
        for (var c in window.classes['entries']) {
            // special groupd Favorits, Tile and Image
            // if empty (no annotation) need to add an empty 'entries' object so they will appear in the interface
            if (['10000001-1001-1001-1001-100000000001', '20000002-2002-2002-2002-200000000002', '30000003-3003-3003-3003-300000000003'].includes(c)) {
                var entry = window.classes['entries'][c];
                if (!entry.hasOwnProperty('entries') || entry['entries'] === undefined || Object.keys(entry['entries']).length === 0) {
                    let id = '90000009-9009-9009-9009-900000000009'.replaceAll(9, 9 + (1 - c[0])); // 1 - c[0] is 0 or a negative value
                    entry['entries'] = {
                        [id]: {
                            'id': id, 'name': 'dummy', 'index': 1, 'color': '#999999', 'keystroke': null
                        }
                    };
                }
                var nextItem = window.parseClassdefEntry(c, window.classes['entries'][c], this);

                // append to div
                this.classLegendDiv.append(nextItem.getMarkup());
            }

        }
        for (var c in window.classes['entries']) {
            if (['10000001-1001-1001-1001-100000000001', '20000002-2002-2002-2002-200000000002', '30000003-3003-3003-3003-300000000003'].includes(c)) continue;

            var nextItem = window.parseClassdefEntry(c, window.classes['entries'][c], this);
            if (nextItem === null) continue;

            if (nextItem instanceof LabelClass) {
                this.labelClasses[c] = nextItem;
            } else {
                // append label class group's entries
                this.labelClasses = {...this.labelClasses, ...nextItem.labelClasses};
            }
            this.items.push(nextItem);

            // append to div
            this.classLegendDiv.append(nextItem.getMarkup());
        }

        // create labelclass color LUT
        for (var lc in this.labelClasses) {
            var nextItem = this.labelClasses[lc];
            var colorString = window.rgbToHex(nextItem.color);
            this.labelToColorMapping[colorString] = nextItem;
            this.indexToLabelclassMapping[nextItem.index] = nextItem;
        }
    }

    getClass(id) {
        if (id == '00000000-0000-0000-0000-000000000000') {
            // dummy class for UI tutorial
            return this.dummyClass;
        }
        return this.labelClasses[id];
    }

    getActiveClass() {
        return this.activeClass;
    }

    getActiveClassID() {
        return (this.activeClass == null ? null : this.activeClass['classID']);
    }

    getActiveClassName() {
        return (this.activeClass == null ? null : this.activeClass['name']);
    }

    getActiveColor() {
        return (this.activeClass == null ? null : this.activeClass['color']);
    }

    getColor(classID) {
        if (classID == '00000000-0000-0000-0000-000000000000') {
            // dummy class for UI tutorial
            return this.dummyClass['color'];
        }
        return this.labelClasses[classID]['color'];
    }

    getColor(classID, defaultColor) {
        if (classID == '00000000-0000-0000-0000-000000000000') {
            // dummy class for UI tutorial
            return this.dummyClass['color'];
        }
        try {
            return this.labelClasses[classID]['color'];
        } catch {
            return defaultColor;
        }
    }

    getName(classID) {
        if (classID == '00000000-0000-0000-0000-000000000000') {
            // dummy class for UI tutorial
            return this.dummyClass['name'];
        }
        return (classID == null || !this.labelClasses.hasOwnProperty(classID) ? null : this.labelClasses[classID]['name']);
    }

    switchoffLabelClasses() {
        for (var lc in this.labelClasses) {
            var labelClassInstance = this.labelClasses[lc]
            if (!$('#labelLegend_' + labelClassInstance.classID).hasClass('legend-inactive')) {
                $('#labelLegend_' + labelClassInstance.classID).addClass('legend-inactive');
                $('#labelLegend_alt_' + labelClassInstance.classID).addClass('legend-inactive');

                var str = ['labelLegend', labelClassInstance.classID, 'favorit'].join('_');
                $('#10000001-1001-1001-1001-100000000001').find("[id^=" + str + "]").addClass('legend-inactive');
                str = ['labelLegend_alt', labelClassInstance.classID, 'favorit'].join('_')
                $('#10000001-1001-1001-1001-100000000001').find("[id^=" + str + "]").addClass('legend-inactive');

                str = ['labelLegend', labelClassInstance.classID, 'tile'].join('_');
                $('#20000002-2002-2002-2002-200000000002').find("[id^=" + str + "]").addClass('legend-inactive');
                str = ['labelLegend_alt', labelClassInstance.classID, 'tile'].join('_')
                $('#20000002-2002-2002-2002-200000000002').find("[id^=" + str + "]").addClass('legend-inactive');

                str = ['labelLegend', labelClassInstance.classID, 'image'].join('_');
                $('#30000003-3003-3003-3003-300000000003').find("[id^=" + str + "]").addClass('legend-inactive');
                str = ['labelLegend_alt', labelClassInstance.classID, 'image'].join('_')
                $('#30000003-3003-3003-3003-300000000003').find("[id^=" + str + "]").addClass('legend-inactive');

            }
        }
    }

    lighthenFirstLabelClass() {
        this.setActiveClass(this.labelClasses[Object.keys(this.labelClasses)[0]]);
        return this.labelClasses[Object.keys(this.labelClasses)[0]];
    }

    lighthenLabelClass(labelClassInstance) {
        if (labelClassInstance == null) return;
        if ($('#labelLegend_' + labelClassInstance.classID).hasClass('legend-inactive')) {
            $('#labelLegend_' + labelClassInstance.classID).removeClass('legend-inactive');
            $('#labelLegend_alt_' + labelClassInstance.classID).removeClass('legend-inactive');

            var str = ['labelLegend', labelClassInstance.classID, 'favorit'].join('_');
            $('#10000001-1001-1001-1001-100000000001').find("[id^=" + str + "]").removeClass('legend-inactive');
            str = ['labelLegend_alt', labelClassInstance.classID, 'favorit'].join('_')
            $('#10000001-1001-1001-1001-100000000001').find("[id^=" + str + "]").removeClass('legend-inactive');

            str = ['labelLegend', labelClassInstance.classID, 'tile'].join('_');
            $('#20000002-2002-2002-2002-200000000002').find("[id^=" + str + "]").removeClass('legend-inactive');
            str = ['labelLegend_alt', labelClassInstance.classID, 'tile'].join('_')
            $('#20000002-2002-2002-2002-200000000002').find("[id^=" + str + "]").removeClass('legend-inactive');

            str = ['labelLegend', labelClassInstance.classID, 'image'].join('_');
            $('#30000003-3003-3003-3003-300000000003').find("[id^=" + str + "]").removeClass('legend-inactive');
            str = ['labelLegend_alt', labelClassInstance.classID, 'image'].join('_')
            $('#30000003-3003-3003-3003-300000000003').find("[id^=" + str + "]").removeClass('legend-inactive');

        }
    }

    addToGroup(classID, groupName, idGroup, count) {

        // add to tile and image group
        var id = 'labelLegend_' + classID;
        var clone = $('#' + id).parent().parent().clone(true);
        clone.attr("id", id + '_ctn_' + groupName);
        clone.attr("style", "display:block");
        // change the button id
        id = "alabelstar_" + classID;
        clone.find("[id='" + id + "']").attr("id", id + "_groupName");
        id = 'labelLegend_' + classID;
        var clonedLabel = $('#' + idGroup).find('#' + id + '_' + groupName);
        if (groupName === 'image' && clonedLabel.length > 0) {
            // already there
            // add count to the element
            let curr = clonedLabel.attr("count");
            if (count === undefined) curr++; else curr = count;
            clonedLabel.attr("count", curr);
            clonedLabel.find("#label-count").text("(" + curr + ") ");

            return;
        }
        clonedLabel = clone.find('#' + id);
        clonedLabel.attr("id", id + '_' + groupName);

        if (groupName === 'image') {
            if (count === undefined) count = 1;
            clonedLabel.attr("count", count);
            clonedLabel.find("#label-count").text("(" + count + ") ");
        }
        var parent = $('#' + idGroup).find('.labelGroup-children');
        clone.appendTo(parent);

        // Removes the label No labels under Tile group
        // count labels for tiles
        var nb = $("[id$='_" + groupName + "']").length;
        // if no labels, set the message
        if (nb > 0) { // no label yet, then that the first one
            $('#' + idGroup).find("#no_label_" + groupName).attr("style", "display:none");
        }
    }

    removeFromGroup(classID, groupName, idGroup) {
        if (groupName === "tile") {
            var id = 'labelLegend_' + classID;
            $('#' + id + '_ctn_' + groupName).remove();
        } else {
            // image group : do not remove is more than one
            var id = 'labelLegend_' + classID;
            var nb = $('#' + id + '_' + groupName).attr("count");
            if (parseInt(nb) - 1 > 0) {
                // update the count
                $('#' + id + '_' + groupName).attr("count", (parseInt(nb) - 1));
                $('#' + id + '_' + groupName).find("#label-count").text("(" + (parseInt(nb) - 1) + ") ");

            } else {
                $('#' + id + '_ctn_' + groupName).remove();
            }
        }

        // show the label No labels under Tile group
        // count labels for tiles
        var nb = $("[id$='_" + groupName + "']").length;
        // if no labels, set the message
        if (nb === 1) { // still not refreshed yet, last one being removed
            $('#' + idGroup).find("#no_label_" + groupName).attr("style", "display:block");
        }
    }

    updateTileGroup(labels) {
        // removes all from the group
        $('#20000002-2002-2002-2002-200000000002').find("tr[id^='labelLegend_']").remove();
        // reset the label no group
        $('#20000002-2002-2002-2002-200000000002').find("#no_label_tile").attr("style", "display:block");

        if (labels === null) return;
        for (const label of labels) {
            this.addToGroup(label, "tile", '20000002-2002-2002-2002-200000000002');
            // check if part of the tile
            let id = 'labelLegend_' + label;
            $('#20000002-2002-2002-2002-200000000002').find('#' + id + '_ctn_image').find('#' + id + '_image').removeClass('legend-inactive');
        }
    }

    updateImageGroup(labels, countLabels) {
        // removes all from the group
        $('#30000003-3003-3003-3003-300000000003').find("tr[id^='labelLegend_']").remove();
        // reset the label no group
        $('#30000003-3003-3003-3003-300000000003').find("#no_label_image").attr("style", "display:block");

        if (labels === null) return;
        for (const label of labels) {
            // check if part of the tile
            // except if mono-labelling mode
            if (window.labelClassHandler.activeLabellingMode == false) {
                this.addToGroup(label, "image", '30000003-3003-3003-3003-300000000003', countLabels[label]);

                let id = 'labelLegend_' + label;
                var labelInTile = $('#20000002-2002-2002-2002-200000000002').find('#' + id + '_tile');
                if (labelInTile.length === 0) {
                    // not there turn it off
                    $('#30000003-3003-3003-3003-300000000003').find('#' + id + '_ctn_image').find('#' + id + '_image').addClass('legend-inactive');
                } else {
                    $('#30000003-3003-3003-3003-300000000003').find('#' + id + '_ctn_image').find('#' + id + '_image').removeClass('legend-inactive');
                }
            }
        }
    }

    setActiveClass(labelClassInstance) {
        if (window.uiBlocked) return;

        // multi-labelling mode
        if (window.labelClassHandler.activeLabellingMode == false) {

            // is there any tile selected ?
            if (window.activeEntryID === null || window.activeEntryID === undefined) return; // no active tile do nothing and return

            // click on another selected label : unselect it
            this.activeClass = labelClassInstance;
            if ($('#labelLegend_' + labelClassInstance.classID).hasClass('legend-inactive')) {
                window.dataHandler.updateActiveAnnotationLabel(this.getActiveClassID(), true)

                this.addToGroup(labelClassInstance.classID, "tile", '20000002-2002-2002-2002-200000000002');
                this.addToGroup(labelClassInstance.classID, "image", '30000003-3003-3003-3003-300000000003');

            } else {
                window.dataHandler.updateActiveAnnotationLabel(this.getActiveClassID(), false);

                this.removeFromGroup(labelClassInstance.classID, "tile", '20000002-2002-2002-2002-200000000002');
                this.removeFromGroup(labelClassInstance.classID, "image", '30000003-3003-3003-3003-300000000003');
            }

            $('#labelLegend_' + labelClassInstance.classID).toggleClass('legend-inactive');
            $('#labelLegend_alt_' + labelClassInstance.classID).toggleClass('legend-inactive');

            var str = ['labelLegend', labelClassInstance.classID, 'favorit'].join('_');
            $('#10000001-1001-1001-1001-100000000001').find("[id^=" + str + "]").toggleClass('legend-inactive');
            str = ['labelLegend_alt', labelClassInstance.classID, 'favorit'].join('_')
            $('#10000001-1001-1001-1001-100000000001').find("[id^=" + str + "]").toggleClass('legend-inactive');

            str = ['labelLegend', labelClassInstance.classID, 'tile'].join('_');
            $('#20000002-2002-2002-2002-200000000002').find("[id^=" + str + "]").toggleClass('legend-inactive');
            str = ['labelLegend_alt', labelClassInstance.classID, 'tile'].join('_')
            $('#20000002-2002-2002-2002-200000000002').find("[id^=" + str + "]").toggleClass('legend-inactive');

            str = ['labelLegend', labelClassInstance.classID, 'image'].join('_');
            $('#30000003-3003-3003-3003-300000000003').find("[id^=" + str + "]").toggleClass('legend-inactive');
            str = ['labelLegend_alt', labelClassInstance.classID, 'image'].join('_')
            $('#30000003-3003-3003-3003-300000000003').find("[id^=" + str + "]").toggleClass('legend-inactive');


            window.activeClassColor = this.getActiveColor();

        } else {
            // mono-labelling mode

            this.activeClass = labelClassInstance;
            this.lighthenLabelClass(labelClassInstance)

        }
    }

    setActiveLabellingMode(labellingMode) {
        if (window.uiBlocked) return;

        // false (default): multi-labelling; true: mono-labelling
        this.activeLabellingMode = labellingMode;

        // unselect all labels
        this.switchoffLabelClasses();

        // unselect all tiles
        window.dataHandler.clearSelection();

        if (labellingMode == true) {
            // mono-labelling mode active
            // activate first label in the list
            var label = this.lighthenFirstLabelClass();

            // and set a red frame around all tiles with that label
            var features = window.dataHandler.getTilesAssociatedWithLabel(label.classID)

            window.dataHandler.setSelectedFeatures(features);
        }

    }

    getActiveLabellingMode() {
        // false (default): multi-labelling; true: mono-labelling
        return this.activeLabellingMode;
    }

    filter(keywords, autoActivateBestMatch) {
        /*
            Hides label class entries and groups if they do not match
            one or more of the keywords given.
            Matching is done through the Levenshtein distance.
            If autoActivateBestMatch is true, the best-matching entry
            (with the lowest Lev. dist.) is automatically set active.
        */
        var minDist = 1e9;
        var bestMatch = null;
        for (var c = 0; c < this.items.length; c++) {
            var response = this.items[c].filter(keywords);
            if (autoActivateBestMatch && response != null && response.dist <= minDist) {
                minDist = response.dist;
                bestMatch = response.bestMatch;
            }
        }

        if (autoActivateBestMatch && bestMatch != null && minDist <= 3) {
            this.setActiveClass(bestMatch);
        }
    }

    filterSelectedLabel(active) {
        for (var c = 0; c < this.items.length; c++) {
            this.items[c].filterSelectedLabel(active);
        }
    }

    copySelectedLabel() {
        let selectedLabels = [];
        for (let c = 0; c < this.items.length; c++) {
            let result = this.items[c].copySelectedLabel();
            if (result) selectedLabels.push(result);
        }
        return selectedLabels.length == 0 ? null : selectedLabels;
    }


    getByIndex(index) {
        /*
            Returns the label class whose assigned index matches the value
            provided. Returns null if no match found.
        */
        try {
            return this.indexToLabelclassMapping[index];
        } catch {
            return null;
        }
    }

    getByColor(color) {
        /*
            Returns the label class whose assigned color matches the values
            provided. Returns null if no match found.
        */
        color = window.rgbToHex(color);
        try {
            return this.labelToColorMapping[color];
        } catch {
            return null;
        }
    }
}