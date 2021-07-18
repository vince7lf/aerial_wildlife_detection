// Function that shows dataset information    
function showDatasetInfo(str) {
        if (str == "") {
            document.getElementById("txtHintDataset").innerHTML = "";
            return;
        } else {
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                document.getElementById("txtHintDataset").innerHTML = this.responseText;
            }
        };
        xmlhttp.open("GET","dl_classification/script/get_dataset_info.php?q="+str,true);

        xmlhttp.send();
        }
    };    


// Function that update the database View with the selected mosaic id and model id
    function updatePredictionView(mos_id,mod_id) {

        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                //document.getElementById("txtHintDataset").innerHTML = this.responseText;
            }
        };
        xmlhttp.open("GET","dl_classification/script/update_prediction_view.php?mos_id="+mos_id+"&mod_id="+mod_id,true);

        xmlhttp.send();
    };

// Function that update the sample class image and reload it
function updateSampleClassImg(class_id,dataset_id, class_name){
    $("#nomClass").text(class_name);
    $("#sampleImgContainer").hide();
    $("#loadingbttnSampleImg").show();
    
    $.post("dl_classification/script/updateClassSample.php",
           {
        class_id: class_id,
        dataset_id: dataset_id,
    }, function (data){
        
        document.getElementById("sampleClassImg").src="dl_classification/images/sample_class.png?time=" + new Date();
        $("#loadingbttnSampleImg").hide();
        $("#sampleImgContainer").show();
        $("#nombreImg").text(data);

    }
    );
};

// Function to show the model detail in a modal
function showModelDetail(model_id, model_name){
    $("#nomModel").text(model_name);

    document.getElementById("modelDetailImg").src="dl_classification/images/model_detail"+model_id+".png?time=" + new Date();
    $.post("dl_classification/script/showModelDetail.php",
           {
        model_id: model_id,
    }, function (data){
        
        //update model info
        $("#modelInfo").html(data);

    }
    );
};

    
    // Fonction pour zoomer sur la mosaique sélectionnée
    function zoomToMosaic(str) {
        if (str != ""){
            var source = mosaicExtentLayer.getSource();
            var features = source.getFeatures();
        
            for (var i=0;i<features.length;i++){
                var attr = features[i].get('mosaic_id');
                if (str == attr){
                    var mosaicExtent = features[i].getGeometry();
                }
            }
            
            view.fit(mosaicExtent,map.getSize());
        }  
    };
        
      
    // Show or hide predictions depending on the mosaic layer selected
    function showPrediction(str) {
        if (str == "") {
            $(".listRadioPrediction").hide();
            $(".modelListText").hide();
                }
        else{
            $(".modelListText").show();
            $(".listRadioPrediction").each(function(){
                // Show the models available that match the mosaic_id
                if ($(this).attr("id") == str) {
                    $(this).show()
                }
                // Else, hide these models
                else{
                    $(this).hide()
                }
            }); 
            };
    };

    
    // Fonction pour zoomer sur la mosaique sélectionnée 
    // et afficher la liste des couches de prédictions disponibles
    function showLayerInformation(str){
        // Reset radio buttons
        document.getElementById("form_list_prediction").reset();
        zoomToMosaic(str);
        showPrediction(str);
    };


//Pour le formulaire de classifications, starts python classification
function makePrediction(){
    

    
    $("#classForm").submit(function(e) {
            $("#loadingbttnClassification").show();
    $("#etatClassification").text(''); // show response from the php script.
    $('#modalClassification').modal('show');

    var url = "dl_classification/script/classifyForm.php"; // the script where you handle the form input.

    $.ajax({
           type: "POST",
           url: url,
           data: $("#classForm").serialize(), // serializes the form's elements.
           success: function(data)
           {
                $("#loadingbttnClassification").hide();
                $("#etatClassification").text(data); 
           }
         });

    e.preventDefault(); // avoid to execute the actual submit of the form.
});
};


