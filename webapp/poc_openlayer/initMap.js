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