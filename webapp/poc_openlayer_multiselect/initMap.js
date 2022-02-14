// for click&select of a tile, refer to https://openlayers.org/en/latest/examples/vector-tile-selection.html

var map, view, staticImage, vectorLayer1;

function creationCarte() {

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

    var canadaStyleSelect = new ol.style.Style({
        fill: new ol.style.Fill({
            color: [0, 0, 255, 0.2]
        }),
        stroke: new ol.style.Stroke({
            color: [177, 163, 148, 0.5],
            width: 2,
            lineCap: 'round'
        })
    });
    // var extent = [0, -3040, 4056, 0];
    var extent = [0, -448, 448, 0];
    var projection = new ol.proj.Projection({
        code: 'xkcd-image',
        units: 'pixels',
        extent: extent,
    });
    staticImage = new ol.layer.Image({
        source: new ol.source.ImageStatic({
            url: './tile448x448_tile.jpg',
            projection: projection,
            imageExtent: extent
        })

    });

    vectorLayer1 = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: './tile448x448_tile.geojson',
            format: new ol.format.GeoJSON(),
        }),
        style: canadaStyle
    });
    var selectInteraction = new ol.interaction.Select({
        condition: ol.events.condition.pointerMove,
        style: canadaStyleSelect
    });
    view = new ol.View({
        projection: projection,
//        center: [2000, -1500],
        center: [0, 0],
        zoom: 1,
    });

    // Instanciate a Map, set the object target to the map DOM id
    map = new ol.Map({
        target: 'map',
        // Add the created layer to the Map
        layers: [staticImage, vectorLayer1]
    });

    /*
    // lookup for selection objects
    let selection = {};

    // Selection
    const selectionLayer = new ol.layer.Vector({
        map: map,
        renderMode: 'vector',
        source: vectorLayer1.getSource(),
        style: function (feature) {
            if (feature.getId() in selection) {
                return canadaStyleSelect;
            }
        },
    });

    map.on(['click', 'pointermove'], function (event) {
        vectorLayer1.getFeatures(event.pixel).then(function (features) {
            if (!features.length) {
                selection = {};
                selectionLayer.changed();
                return;
            }
            const feature = features[0];
            if (!feature) {
                return;
            }
            const fid = feature.getId();

            selection = {};
            // add selected feature to lookup
            selection[fid] = feature;

            selectionLayer.changed();
        });
    });*/

    // Set the view for the map
    map.setView(view);
    map.addInteraction(selectInteraction)

}

// ----------------------------------------------------------------------------
class MapOlElement {

    constructor(id, image, elTarget) {
        this.image = image;
        this.elTarget = elTarget;
        this.imageSrcOrg = image.currentSrc;
        //this.imageSrcOrg = image.src;
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
                width: 8,
            }),
        });

        const highlightStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(200,20,20,0.8)',
                width: 4,
            }),
        });
        const highlightStyleSelected = new ol.style.Style({
            fill: new ol.style.Fill({
                color: '#EEE',
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(200,20,20,0.8)',
                width: 2,
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
                var labels = "fake label";
                var xstyle = canadaStyle;
                if (labels.size > 0) {
                    xstyle = canadaStyleAnnoted;
                }
                return xstyle;
            }
        });
        // multiple select feature
        const selected = [];

        var selectInteraction = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            style: function (f) {
                var style = selectedCountry;
                const selIndex = selected.indexOf(f);
                if (selIndex < 0) {
                    style = highlightStyleSelected;
                }
                return style;
            }
        });

        // var clickInteraction = new ol.interaction.Select({
        //     condition: ol.events.condition.pointerClick,
        //     style: function (feature) {
        //         // set current tile/annotation selected
        //         var props = feature.getProperties();
        //         var location = props['Location'];
        //         //window.dataHandler.tileSelected(location);
        //
        //         const selIndex = selected.indexOf(feature);
        //         var style = canadaStyle;
        //         if (selIndex < 0) {
        //             selected.push(feature);
        //             style = highlightStyle;
        //             feature.setStyle(style);
        //         } else {
        //             selected.splice(selIndex, 1);
        //             feature.setStyle(style);
        //         }
        //         self.render();
        //         return undefined;
        //     }
        // });
        var clickInteraction = new ol.interaction.Select({
            condition: ol.events.condition.singleClick,
            style: function (feature) {
                // set current tile/annotation selected
                var props = feature.getProperties();
                var location = props['Location'];
                //window.dataHandler.tileSelected(location);

                const selIndex = selected.indexOf(feature);
                var style = canadaStyle;
                if (selIndex < 0) {
                    selected.push(feature);
                    style = highlightStyle;
                    // feature.setStyle(style);
                } else {
                    selected.splice(selIndex, 1);
                    // feature.setStyle(style);
                }
                self.render();
                return style;
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
            target: this.elTarget,
            // Add the created layer to the Map
            layers: [staticImage, this.vectorLayer1],
            controls: ol.control.defaults().extend([myControl]),
        });

        map.on('singleclick', function (e) {
            map.forEachFeatureAtPixel(e.pixel, function (f) {
                const selIndex = selected.indexOf(f);
                if (selIndex < 0) {
                    selected.push(f);
                    f.setStyle(highlightStyle);
                } else {
                    selected.splice(selIndex, 1);
                    f.setStyle(canadaStyle);
                }

            });
        });
        //Set the view for the map
        map.setView(view);

        // map.addInteraction(selectInteraction);
        //
        // map.addInteraction(clickInteraction);
    }
}
