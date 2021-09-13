<?php
$mos_id = intval($_GET['mos_id']);
$mod_id = intval($_GET['mod_id']);


// Include function
include "php_array_parse_function.php";
// attempt a connection
include "config.php";


// Query to select the names of the classes
$sqlClassName = "SELECT class_name
FROM dataset, model
WHERE dataset.dataset_id = model.dataset_id
AND
model_id = '" .$mod_id. "'";

$resultClassName = pg_query($dbh, $sqlClassName) or die("Error in SQL query: " . pg_last_error());

// Declare empty string
$str = '';
while ($row = pg_fetch_array($resultClassName)) {
        
    // Format the class name as list
    $class_name = pg_array_parse($row['class_name']);
    
        // Counter for the number of classes
        $count = 1;
        foreach ($class_name as &$value) {
            // Create the select query for the view with such as class[x] as class_name,
            $str .= 'class['.$count.'] as '  .$value. ', ';
            // Increment class count;
            $count = $count+1;

        }
    
	}


// Query to update the View
$sqlUpdatePredictionView = "DROP VIEW prediction_view;
CREATE OR REPLACE VIEW prediction_view AS(
SELECT tile_number, " .$str. " most_likely_class, geom
FROM prediction
WHERE mosaic_id = " .$mos_id. "
AND model_id =" .$mod_id. ");";

pg_query($dbh, $sqlUpdatePredictionView) or die("Error in SQL query: " . pg_last_error());




// close connection

pg_close($dbh);

?>
    