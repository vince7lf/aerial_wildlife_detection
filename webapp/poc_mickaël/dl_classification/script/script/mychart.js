function creationChart(){

        
         var displayFeatureInfo = function(pixel) {


        var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
          return feature;
        });
        
        
        //var info = document.getElementById('info');
        if (feature) {
            $('#featureList').empty();
            // Get all field names
            var allFieldNames = ['test1','test2','test3','test4'];
            var fieldName = [];
            var fieldValue = [];
            var backgroundColor = []; // Color for the bar chart
            var borderColor = []; // Color for the bar border of the chart
            
            // minus 1 not to have the most_likely_class field
            for (var i=0;i<allFieldNames.length-1;i++){            
                var field1 = allFieldNames[i];
                fieldName.push(field1);
                fieldValue.push(Math.random()*100);
                backgroundColor.push(predictionColor[field1]);
                borderColor.push('rgba(64, 64, 64,1)');
                
                //$("#featureList").append('<li>' + field1 + ': ' + '<div class="featureValue">'+ feature.get(field1)+ '</div>' + '</li>');
            };
        
            //CHART
        var ctx = document.getElementById("myChart").getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
            labels: fieldName, //["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [{
            label: false,
            data: fieldValue,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            borderWidth: 1
            }]
                },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            min:0,
                            max: 100
                        },
                        scaleLabel: {
                            display: true,
                            labelString: '%'
                        }
                    }]
                },
                animation: false,
                title: {
                    display: true,
                    text: 'Score d\'appartenance à chaque classe',
                },
                legend: {
    	           display: false
                },
            }
        });
            
            
    
        } else {
          $('.featureValue').empty();
        }


      };
    
        map.on('click', function(evt) {
        var pixel =evt.pixel;
        displayFeatureInfo(pixel);
      });
    
    
    
};