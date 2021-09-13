
function creationSelectionCouche(){
	
	$( "#osm" ).change(function(){
		osmLayer.setVisible(!osmLayer.getVisible());
		bingSatLayer.setVisible(false);
	});
	
	$( "#bingsat" ).change(function(){
		osmLayer.setVisible(false);
		bingSatLayer.setVisible(!bingSatLayer.getVisible());
	});
    

    	
    // Couches panel
	$( "#showHideMosaicLayer" ).click(function(){
		mosaicLayer.setVisible(!mosaicLayer.getVisible());
	});
    
    // Update the map and the prediction view
    $( ".listRadioPrediction" ).change(function(){
        var mosaic_id = this.id;
        
        // Look into the children of the node to find the value of the radio button
        var model_id = this.children[0].children[0].value;
        
        // Reload the predictionViewLayer by clearning the feature source
        var source = predictionViewLayer.getSource();
        source.clear();
        
        // Query the database to update the View
        updatePredictionView(mosaic_id,model_id);
        
        // Set the layer to visible
        predictionViewLayer.setVisible(true);

        
	});
    
        // To toggle the button afficher/masquer the mosaic layer
    jQuery(function ($) {
        $('#showHideMosaicLayer').on('click', function () {
            var $el = $(this),textNode = this.lastChild;
            $el.find('span').toggleClass('glyphicon-eye-close glyphicon-eye-open');
            //textNode.nodeValue = ($el.hasClass('showHideMosaicLayer') ? ' Masquer' : ' Afficher')
            $el.toggleClass('showHideMosaicLayer');
            });
    });
    
}
