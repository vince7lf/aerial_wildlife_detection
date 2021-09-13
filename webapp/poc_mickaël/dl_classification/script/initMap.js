var osmLayer, bingSatLayer, mosaicExtentLayer, mosaicLayer, predictionViewLayer, map, view, montreal, staticImage, vectorLayer1;

var predictionColor;

function creationCarte(){
    
    predictionColor = {
        building: "rgba(38, 38, 38, 0.7)",
        barren_land:'rgba(153, 102, 51, 0.7)',
        trees: 'rgba(0, 77, 0, 0.7)',
        grassland: 'rgba(102, 153, 0, 0.7)',
        road: 'rgba(255, 255, 0, 0.7)',
        water: 'rgba(0, 102, 255, 0.7)',
        other: 'rgba(255, 128, 128, 0.7)'
    };
    
    // Declare the style for the prediction layer
    var predictionStyle = function(feature, resolution) {
        var mostLikelyClass = feature.get('most_likely_class');
        var strokeColor = 'rgba(64, 64, 64,1)'
        
        var buildingStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(38, 38, 38, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];
        var barren_landStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(153, 102, 51, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];
        var treesStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 77, 0, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];
        var grasslandStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(102, 153, 0, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];        
        var roadStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 0, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];
        var waterStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(0, 102, 255, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];
        var otherStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 128, 128, 0.7)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];
        var unknownStyle = [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255,255,255,0.4)'
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColor,
                    width: 1.25
                })
            })
        ];

    if ( mostLikelyClass == 'building') {
        return buildingStyle;
        
    } else if (mostLikelyClass == 'barren_land'){
        return barren_landStyle;
        
    } else if (mostLikelyClass == 'trees'){
        return treesStyle;
        
    } else if (mostLikelyClass == 'grassland'){
        return grasslandStyle;
        
    } else if (mostLikelyClass == 'road'){
        return roadStyle;
        
    } else if (mostLikelyClass == 'water'){
        return waterStyle;
        
    } else if (mostLikelyClass == 'other'){
        return otherStyle;
        
    } else if (mostLikelyClass == 'barren_land'){
        return barren_landStyle;
        
    } else{
        return unknownStyle;
        
    }
      };
    
    
    //Declare a Tile layer with OSM source
    osmLayer = new ol.layer.Tile({
         source: new ol.source.OSM()
        });
    
    //Declare a Tile layer with Bing Maps source
    bingSatLayer = new ol.layer.Tile({
	   source: new ol.source.BingMaps({
           key: 'ApfshPQhHjj4v3cf6QqQEcMhu38uc_G0-df_JqBUvpMFjFNngDNeEI3zRlHVZFIa',
           imagerySet: 'Aerial'
            })
		});
    
    osmLayer.setVisible(true);
    bingSatLayer.setVisible(false);


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
	var extent = [0, -3040, 4056, 0];
var projection = new ol.proj.Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extent,
});
	staticImage = new ol.layer.Image({
		source : new ol.source.ImageStatic({
			url : './Soleil_ISO100_1m.JPG',
			projection : projection,
			imageExtent : extent
		})
	
	});
    
    //Declare an image layer, contains all mosaics
    mosaicLayer = new ol.layer.Image({
          //extent: [-13884991, 2870341, -7455066, 6338219],
          source: new ol.source.ImageWMS({
            url: 'http://igeomedia.com/cgi-bin/mapserv?map=/home/paul/mapfile/dl_classification/config.map',
            params: {'LAYERS': 'merlischachen,sherbrooke'},
            ratio: 1,
            serverType: 'mapserver'
          })
        });
    
    // Vector layer that contains the extent of each mosaic
    // The layer doesnt appear on the map, it is hidden
    mosaicExtentLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
			 url:"http://igeomedia.com/cgi-bin/mapserv?map=/home/paul/mapfile/dl_classification/config.map&service=wfs&version=1.1.0&request=getfeature&typename=mosaic&srsName=EPSG:3857",
                format: new ol.format.WFS({
                })
            }),
        style: new ol.style.Style({ visibility: 'hidden' }),
		});
    mosaicExtentLayer.setVisible(true);
    
    // Vector layer that contains the prediction as a View    
    predictionViewLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
			 url:"http://igeomedia.com/cgi-bin/mapserv?map=/home/paul/mapfile/dl_classification/config.map&service=wfs&version=1.1.0&request=getfeature&typename=prediction_view&srsName=EPSG:3857",
                format: new ol.format.WFS({
                })
            }),
            style: predictionStyle,
		});
        predictionViewLayer.setVisible(false);
    
    
    // Create latitude and longitude and convert them to default projection
    montreal = ol.proj.transform([-73.7562, 45.5495], 'EPSG:4326', 'EPSG:3857');
    merlischachen = ol.proj.transform([8.409522, 47.066670], 'EPSG:4326', 'EPSG:3857');
    // Create a View, set it center and zoom level

    vectorLayer1 = new ol.layer.Vector({
        source: new ol.source.Vector({
					url: './tuile.geojson',
					format: new ol.format.GeoJSON(),
				}),
	style:canadaStyle
      });
var selectInteraction = new ol.interaction.Select({
	    	condition: ol.events.condition.pointerMove,
		style: canadaStyleSelect
      });
    view = new ol.View({
		projection:projection,
        center: [2000, -1500],
        zoom: 2,
        });
    
    // Instanciate a Map, set the object target to the map DOM id
    map = new ol.Map({
        target: 'map',
        // Add the created layer to the Map
        layers: [staticImage, vectorLayer1]
        });


    // Set the view for the map
    map.setView(view);
	map.addInteraction(selectInteraction)
    

    
}