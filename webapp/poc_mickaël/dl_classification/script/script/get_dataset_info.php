<?php        
$q = intval($_GET['q']);

// Include function
include "php_array_parse_function.php";
// attempt a connection
include "config.php";



// execute query
$sqlDatasetInfo = "SELECT dataset_id, nb_class, class_name, spatial_res_m
FROM dataset
WHERE dataset_id = '".$q."'";

$resultDatasetInfo = pg_query($dbh, $sqlDatasetInfo) or die("Error in SQL query: " . pg_last_error());

$sqlDescription = "SELECT reference, url
FROM dataset
WHERE dataset_id = '".$q."'";
    
$resultDescription = pg_query($dbh, $sqlDescription) or die("Error in SQL query: " . pg_last_error());
 

$sqlModel = "SELECT model_name, model_id
FROM dataset, model
WHERE model.dataset_id = dataset.dataset_id
AND
dataset.dataset_id = '".$q."'";

$resultModel = pg_query($dbh, $sqlModel) or die("Error in SQL query: " . pg_last_error());

// execute query (note St_GeometryN to use the 1st point of the multipoint geom)
$sqlMosaic = "SELECT mosaic_id, mosaic_name
FROM mosaic
ORDER BY mosaic_name asc";

$resultMosaic = pg_query($dbh, $sqlMosaic) or die("Error in SQL query: " . pg_last_error());


    
echo '<ul class="ulDataset">';

while ($row = pg_fetch_array($resultDatasetInfo)) {
    
    // Convert the pg array to php array
    $class_name = pg_array_parse($row['class_name']);
    
    $dataset_id = $row['dataset_id'];
    echo "<li><b>Nom des classes (" . $row['nb_class'] . ") :</b>";
        // Format the class name as list
        echo '<div class="listClass">';
        echo '<ul>';
        // Index for the position (or class_id) of the class name
        $index = 0;
        
        
        foreach ($class_name as &$value) {
            $text_classname = "'".$value."'";
            echo '<li><a href="#my_modal" onclick="updateSampleClassImg('.$index.','.$dataset_id.','.$text_classname.')" data-toggle="modal" data-label-id=' .$index. '>' .$value. '</a></li>';
            $index++;
        }
        echo '</ul>
        </li>';
        echo '</div>';
    echo "<li><b>Résolution spatiale [m] : </b><spam>" . $row['spatial_res_m'] . "</spam></li>";
    
	}


    
while ($row = pg_fetch_array($resultDescription)) {
    
    echo '<li><b> Source des données : </b>' .$row['reference']. '. <a href="' .$row['url']. '" target="_blank">Plus d\'information</a></li>';
    
	}    

echo '</ul>';

echo "<h4> Sélectionnez un modèle et une image à classifier</h4>";


// DEBUT FORMULAIRE
echo '<form id="classForm" action="dl_classification/script/classifyForm.php" method="post" >';

echo'<label for="inputModel">1. Modèles</label>';
echo '<div id = "inputModel">';

while ($row = pg_fetch_array($resultModel)) {
    $text_modelName = "'".$row["model_name"]."'";
    echo '<div class="form-check">';
    echo '<input class="form-check-input" type="radio" name="model" value="'.$row["model_id"].'" id="'.$row["model_name"].'" required>';
    echo '<label class="form-check-label" for="'.$row["model_name"].'">&nbsp'.$row["model_name"]. '</label>';
    
    echo '<span><a href="#modalModele" onclick="showModelDetail('.$row["model_id"].','.$text_modelName.' )" data-toggle="modal" data-label-id=' .$row["model_id"]. '>       Détail</a></span>';
echo '</div>';

	};

echo '</div>';

    echo '<div class="form-group">';
    echo'<label for="inputMosaic">2. Images</label>';
    echo '<select id = "inputMosaic" class="form-control" name="inputMosaic" required>';
        echo "<option value=''>Sélectionner une image</option>";
        while ($row = pg_fetch_array($resultMosaic)) {
            echo '<option value="'.$row['mosaic_id'].'">'.$row['mosaic_name'].'</option>';
	   };
    echo '</select>';

  echo '</div>';
  echo '<button id="buttonClassForm" class="btn btn btn-default" type="submit" onclick="makePrediction()">Classifier...</button>';    

echo '</form>';



/*



echo "<b> Sélectionnez un modèle et une image à classifier :</b>";
echo "<p> </p>";


echo '<form  action="" target="#modalClassification">';

echo "<spam> 1. Modèle(s): </spam>";

        
while ($row = pg_fetch_array($resultModel)) {
    
    echo '<div class="form-check">';
    echo '<div class="listModel">';
   echo  '<label class="radio-inline"><input type="radio" name="model" value="'.$row["model_id"].'">'.$row["model_name"].'<br>';
    echo '</label></div>';
    echo "</div>";

	};


echo "<p></p>";
echo "<spam> 2. Image: </spam>";
echo "<select>";
echo "<option value=''>Sélectionner image</option>";

echo "</select>";
echo "<p> </p>";


echo '<input type="submit" value="Classifier...">';

echo "</form>";

*/
// free memory
pg_free_result($resultDatasetInfo);
pg_free_result($resultDescription);
pg_free_result($resultModel);
pg_free_result($resultMosaic);



// close connection

pg_close($dbh);



?>
